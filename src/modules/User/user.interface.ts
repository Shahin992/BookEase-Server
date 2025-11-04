import { Document } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'moderator';
  comparePassword(candidatePassword: string): Promise<boolean>;
}