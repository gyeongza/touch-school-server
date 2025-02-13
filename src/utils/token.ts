import { Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { User } from '../types/user';

interface TokenPayload {
  id: number;
  phoneNumber: string;
  schoolId: number;
  exp: number;
}

export const TOKEN_CONFIG = {
  EXPIRY_DAYS: 30,
  COOKIE_NAME: 'access-token',
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    domain: '.touch-school.site',
    path: '/',
  },
};

export const tokenUtils = {
  generateToken(user: User): { token: string; expiryDate: Date } {
    const expiryDate = new Date(
      Date.now() + TOKEN_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    const payload: TokenPayload = {
      id: user.id,
      phoneNumber: user.phoneNumber,
      schoolId: user.schoolId,
      exp: Math.floor(expiryDate.getTime() / 1000),
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || '');
    return { token, expiryDate };
  },

  setTokenCookie(res: Response, token: string) {
    res.cookie(TOKEN_CONFIG.COOKIE_NAME, token, {
      ...TOKEN_CONFIG.COOKIE_OPTIONS,
      maxAge: TOKEN_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });
  },

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
  },

  extractTokenFromRequest(req: Request): string | null {
    const cookieToken = req.cookies[TOKEN_CONFIG.COOKIE_NAME];
    if (cookieToken) return cookieToken;

    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    return authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;
  },
};
