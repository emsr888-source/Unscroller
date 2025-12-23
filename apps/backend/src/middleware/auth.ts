import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    [key: string]: any;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};
