import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { generateTokenAndSetCookie } from '../utils/auth';

const router = express.Router();
const prisma = new PrismaClient();

// 로그인 처리
router.post('/', async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: '전화번호를 입력해주세요' });
  }

  try {
    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      return res.status(404).json({
        message: '등록되지 않은 사용자입니다',
        errorMessageKey: 'USER_NOT_FOUND',
      });
    }

    generateTokenAndSetCookie(user, res);

    // token 제외하고 사용자 정보 응답
    res.status(200).json({
      message: '로그인이 완료되었습니다',
      user,
    });
  } catch (error) {
    console.error('로그인 처리 중 오류 발생:', error);
    res.status(500).json({ message: '로그인 처리 중 오류가 발생했습니다' });
  }
});

export default router;
