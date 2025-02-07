import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

interface TokenPayload {
  id: number;
  phoneNumber: string;
  schoolId: number;
  exp: number;
}

export const generateTokenAndSetCookie = (
  user: User,
  res: Response
): { accessToken: string; accessTokenExpiryTime: string } => {
  const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const payload: TokenPayload = {
    id: user.id,
    phoneNumber: user.phoneNumber,
    schoolId: user.schoolId,
    exp: Math.floor(expiryDate.getTime() / 1000), // JWT exp claim은 초 단위
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || '');

  res.cookie('access-token', accessToken, {
    httpOnly: true,
    secure: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: 'none',
    domain: '.touch-school.site',
    path: '/',
  });

  return {
    accessToken,
    accessTokenExpiryTime: expiryDate.toISOString(),
  };
};
