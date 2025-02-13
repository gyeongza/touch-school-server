import { Response } from 'express';
import { User } from '../types/user';
import { tokenUtils } from './token';

export interface AuthTokenResult {
  accessToken: string;
  accessTokenExpiryTime: string;
}

export const generateTokenAndSetCookie = (
  user: User,
  res: Response
): AuthTokenResult => {
  const { token, expiryDate } = tokenUtils.generateToken(user);
  tokenUtils.setTokenCookie(res, token);

  return {
    accessToken: token,
    accessTokenExpiryTime: expiryDate.toISOString(),
  };
};
