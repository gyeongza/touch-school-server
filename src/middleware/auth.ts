import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token = req.cookies['access-token'];

  // 쿠키에 토큰이 없으면 Authorization 헤더 확인
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : req.headers.authorization;
  }

  if (!token) {
    logger.error('인증이 필요합니다');
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('유효하지 않은 토큰입니다');
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다',
    });
  }
};
