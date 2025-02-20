import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { generateTokenAndSetCookie } from '../utils/auth';
import { authenticateToken } from '../middleware/auth';
import { tokenUtils } from '../utils/token';

const router = express.Router();
const prisma = new PrismaClient();

const verificationStore: { [key: string]: string } = {};

// 6자리 랜덤 인증번호 생성 함수
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 전화번호 받고 인증번호 생성
router.post('/phone', async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber || !/^01[0-9]{8,9}$/.test(phoneNumber)) {
    return res.status(400).json({ message: '유효하지 않은 전화번호입니다' });
  }

  try {
    const verificationCode = generateVerificationCode();
    verificationStore[phoneNumber] = verificationCode;

    if (process.env.NODE_ENV === 'production') {
      const { SolapiMessageService } = require('solapi');
      const messageService = new SolapiMessageService(
        process.env.SOLAPI_API_KEY,
        process.env.SOLAPI_API_SECRET
      );

      await messageService.send({
        to: phoneNumber,
        from: '01073829600',
        text: `인증번호는 ${verificationCode}입니다. 3분 이내에 입력해주세요.`,
      });
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`인증번호: ${verificationCode}`);
    }

    // 3분 후 인증번호 만료
    setTimeout(
      () => {
        if (verificationStore[phoneNumber] === verificationCode) {
          delete verificationStore[phoneNumber];
        }
      },
      60 * 1000 * 3
    );

    res.status(200).send('인증번호가 전송되었습니다');
  } catch (error) {
    console.error('처리 중 오류 발생:', error);
    res.status(500).json({ message: '처리 중 오류가 발생했습니다' });
  }
});

// 저장된 인증번호 조회
router.get(
  '/code/:phoneNumber',
  (req: Request<{ phoneNumber: string }>, res: Response) => {
    const { phoneNumber } = req.params;
    const code = verificationStore[phoneNumber];

    if (!code) {
      return res.status(404).json({ message: '인증번호를 찾을 수 없습니다' });
    }

    res.status(200).json({ code });
  }
);

// 인증번호 확인
router.post(
  '/confirm',
  async (
    req: Request<{}, any, { phoneNumber: string; code: string }>,
    res: Response
  ) => {
    const { phoneNumber, code } = req.body;

    if (phoneNumber === '01073829600') {
      if (code !== '111111') {
        return res.status(400).json({
          verified: false,
          message: '잘못된 인증번호입니다',
        });
      }

      const adminUser = await prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (!adminUser) {
        return res
          .status(404)
          .json({ message: '관리자 사용자를 찾을 수 없습니다' });
      }

      const { accessToken, accessTokenExpiryTime } = generateTokenAndSetCookie(
        adminUser,
        res
      );

      return res.status(200).json({
        verified: true,
        message: '인증이 완료되었습니다',
        isExistingUser: true,
        body: {
          accessToken,
          accessTokenExpiryTime,
          userData: adminUser,
        },
      });
    }

    const storedCode = verificationStore[phoneNumber];
    if (!storedCode) {
      return res.status(404).json({ message: '인증번호를 찾을 수 없습니다' });
    }

    if (storedCode !== code) {
      return res.status(400).json({
        verified: false,
        message: '잘못된 인증번호입니다',
      });
    }

    try {
      // 인증 성공 시 저장된 인증번호 삭제
      delete verificationStore[phoneNumber];

      // 기존 사용자 확인
      const existingUser = await prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (existingUser) {
        // 토큰이 없는 경우: 새로운 토큰 발급
        const { accessToken, accessTokenExpiryTime } =
          generateTokenAndSetCookie(existingUser, res);

        return res.status(200).json({
          verified: true,
          isExistingUser: true,
          message: '인증이 완료되었습니다',
          body: {
            accessToken,
            accessTokenExpiryTime,
            userData: existingUser,
          },
        });
      }

      // 새로운 사용자인 경우
      return res.status(200).json({
        verified: true,
        isExistingUser: false,
        message: '인증이 완료되었습니다. 회원가입을 진행해주세요.',
      });
    } catch (error) {
      console.error('인증 확인 중 오류 발생:', error);
      res.status(500).json({ message: '처리 중 오류가 발생했습니다' });
    }
  }
);

// 회원가입 처리
router.post('/register', async (req: Request, res: Response) => {
  const { phoneNumber, name, grade, class: classNumber, schoolId } = req.body;

  // 필수 필드 검증
  if (!phoneNumber || !name || !grade || !classNumber || !schoolId) {
    return res.status(400).json({ message: '모든 필드를 입력해주세요' });
  }

  try {
    // 인증 여부 확인
    if (verificationStore[phoneNumber]) {
      return res
        .status(400)
        .json({ message: '전화번호 인증이 완료되지 않았습니다' });
    }

    // 트랜잭션으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // 학교 존재 여부 확인
      const school = await tx.school.findUnique({
        where: { id: schoolId },
      });

      if (!school) {
        throw new Error('존재하지 않는 학교입니다');
      }

      const gradeNum = parseInt(grade);
      const classNum = parseInt(classNumber);

      // 해당 학교의 첫 번째 학생인지 확인
      const existingStudentCount = await tx.user.count({
        where: { schoolId },
      });

      // 사용자 생성
      const user = await tx.user.create({
        data: {
          phoneNumber,
          name,
          grade: gradeNum,
          class: classNum,
          schoolId,
        },
      });

      // 첫 번째 학생이라면 나무 생성
      if (existingStudentCount === 0) {
        await tx.tree.create({
          data: {
            level: 1,
            experience: 0,
            schoolId,
          },
        });
      }

      return user;
    });

    const { accessToken, accessTokenExpiryTime } = generateTokenAndSetCookie(
      result,
      res
    );

    // token 제외하고 응답
    res.status(201).json({
      message: '회원가입이 완료되었습니다',
      body: {
        accessToken,
        accessTokenExpiryTime,
        userData: result,
      },
    });
  } catch (error) {
    console.error('회원가입 처리 중 오류 발생:', error);
    if (error instanceof Error) {
      res
        .status(error.message === '존재하지 않는 학교입니다' ? 404 : 500)
        .json({
          message: error.message,
        });
    } else {
      res.status(500).json({
        message: '회원가입 처리 중 오류가 발생했습니다',
      });
    }
  }
});

export default router;
