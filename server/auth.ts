import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './db';

const JWT_SECRET = 'leave-mgmt-secret-key-2026';

export interface UserPayload {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'staff';
}

export function login(username: string, password: string): { token: string; user: UserPayload } | null {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user) return null;

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return null;

  const payload: UserPayload = {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  return { token, user: payload };
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}
