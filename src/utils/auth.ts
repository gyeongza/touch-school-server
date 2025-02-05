import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

interface TokenPayload {
  id: number;
  phoneNumber: string;
  schoolId: number;
}

export const generateTokenAndSetCookie = (user: User, res: Response): void => {
  const payload: TokenPayload = {
    id: user.id,
    phoneNumber: user.phoneNumber,
    schoolId: user.schoolId,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || '', {
    expiresIn: '30d',
  });

  res.cookie('access-token', token, {
    httpOnly: true,
    secure: true, // sameSite: 'none'을 사용할 때는 반드시 true로 설정
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: 'none', // 크로스 사이트 요청 허용
    domain: '.touch-school.site',
    path: '/',
  });
};
