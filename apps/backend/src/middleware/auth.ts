import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwt';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. No token provided.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = getJwtSecret();

  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.name === 'TokenExpiredError' ? 'Token expired. Please login again.' : 'Invalid token.'
    });
  }
};
