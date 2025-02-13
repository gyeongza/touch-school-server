import { Response } from 'express';
import { User } from '../types/user';
import { tokenUtils } from './token';

export const generateTokenAndSetCookie = (
  user: User,
  res: Response
): { accessToken: string; accessTokenExpiryTime: string } => {
  const { token, expiryDate } = tokenUtils.generateToken(user);
  tokenUtils.setTokenCookie(res, token);

  return {
    accessToken: token,
    accessTokenExpiryTime: expiryDate.toISOString(),
  };
};
