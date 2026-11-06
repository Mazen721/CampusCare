import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { DEMO_ACCOUNTS, type Role, type TechnicianAvailability } from '../../config/constants';
import { ApiError } from '../../shared/utils/ApiError';
import { User, type UserDocument } from './user.model';
import type { ChangePasswordInput, LoginInput } from './auth.validation';

const PASSWORD_ROUNDS = 12;

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  contactPhone?: string;
  isActive: boolean;
  specializations: string[];
  skills: string[];
  availability?: TechnicianAvailability;
  createdAt: Date;
}

export interface AuthResponse {
  token: string;
  user: SafeUser;
}

export function toSafeUser(user: UserDocument): SafeUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    contactPhone: user.contactPhone,
    isActive: user.isActive,
    specializations: user.specializations ?? [],
    skills: user.skills ?? [],
    availability: user.availability,
    createdAt: user.createdAt,
  };
}

function issueToken(user: UserDocument): string {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized(
      'This account has been deactivated. Contact a university administrator.',
    );
  }

  return { token: issueToken(user), user: toSafeUser(user) };
}

export async function demoLogin(role: Role): Promise<AuthResponse> {
  const demoAccount = DEMO_ACCOUNTS[role];
  const user = await User.findOne({ email: demoAccount.email, isActive: true });

  if (!user) {
    throw new ApiError(
      503,
      'DEMO_ACCOUNT_MISSING',
      'The demo account for this role is not available. Run the seed script first.',
    );
  }

  return { token: issueToken(user), user: toSafeUser(user) };
}

export async function getCurrentUser(userId: string): Promise<SafeUser> {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('This account is inactive or no longer exists');
  }

  return toSafeUser(user);
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const user = await User.findById(userId).select('+passwordHash');

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('This account is inactive or no longer exists');
  }

  const currentMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!currentMatches) {
    throw ApiError.badRequest('Your current password is incorrect');
  }

  const samePassword = await bcrypt.compare(input.newPassword, user.passwordHash);
  if (samePassword) {
    throw ApiError.badRequest('Your new password must be different from your current password');
  }

  user.passwordHash = await bcrypt.hash(input.newPassword, PASSWORD_ROUNDS);
  await user.save();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_ROUNDS);
}
