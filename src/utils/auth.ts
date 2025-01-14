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
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
  });
};
