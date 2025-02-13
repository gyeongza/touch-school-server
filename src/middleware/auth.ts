import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { tokenUtils } from '../utils/token';

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
  const token = tokenUtils.extractTokenFromRequest(req);

  if (!token) {
    logger.error('인증이 필요합니다');
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다',
    });
  }

  try {
    req.user = tokenUtils.verifyToken(token);
    next();
  } catch (error) {
    logger.error('유효하지 않은 토큰입니다');
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다',
    });
  }
};
