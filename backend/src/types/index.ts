import { Request } from 'express';

export type UserRole = 'admin' | 'teacher' | 'student' | 'client';

export interface AuthPayload {
  userId: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}
