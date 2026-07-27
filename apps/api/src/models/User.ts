import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'editor';

export interface IUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  photoUrl: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    photoUrl: { type: String, default: '' },
    role: { type: String, enum: ['admin', 'editor'], default: 'editor' },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform(_doc, ret) {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj._id;
    delete obj.__v;
    delete obj.passwordHash;
    return obj;
  },
});

export const UserModel = model<IUser>('User', userSchema);

/** Hash a plain-text password */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/** Compare plain-text against a hash */
export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
