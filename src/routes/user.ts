import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateTokenAndSetCookie } from '../utils/auth';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { GetUserResponse } from '../types/user';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: '인증이 필요합니다' });
    }

    // Bearer 토큰에서 실제 토큰 부분만 추출
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '유효하지 않은 토큰 형식입니다' });
    }

    // 토큰 검증 및 사용자 ID 추출
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    const userId = decoded.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { school: true },
    });

    console.log('user', user);

    if (!user) {
      return res.status(404).json({ message: '등록되지 않은 사용자입니다' });
    }

    const userResponse: GetUserResponse = {
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      grade: user.grade,
      class: user.class,
      schoolId: user.schoolId,
      createdAt: user.createdAt,
      school: user.school
        ? {
            id: user.school.id,
            name: user.school.name,
            address: user.school.address || null,
          }
        : null,
    };

    res.status(200).json({
      message: '사용자 조회가 완료되었습니다',
      user: userResponse,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: '유효하지 않은 토큰입니다' });
    }
    console.error('사용자 조회 중 오류 발생:', error);
    res.status(500).json({ message: '사용자 조회 중 오류가 발생했습니다' });
  }
});

export default router;
