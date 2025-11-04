import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.cookie;
  if (!token) {
    return res.status(401).json({ success: false, message: 'You have no access to this route' });
  }
  
  try {
    const decoded = jwt.verify(token, 'secretKey') as { userId: string, role: string };
    (req as any).user = decoded;
    console.log('decoded===>', decoded)
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    res.status(401).json({ success: false, message: 'You have no access to this route' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user || !roles.includes((req as any).user.role)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to access this route' });
    }
    next();
  };
};
