import jwt from 'jsonwebtoken';

import { env } from '../env';

type TokenPayload = {
  sub: string;
  email: string;
};

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
    throw new Error('Malformed token');
  }
  return { sub: decoded.sub, email: String((decoded as jwt.JwtPayload).email ?? '') };
}
