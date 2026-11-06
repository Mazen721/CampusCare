import type { Role } from '../../config/constants';
import { logActivity } from '../../shared/services/activityLog.service';
import { ApiError } from '../../shared/utils/ApiError';
import { paginate, parsePagination } from '../../shared/utils/paginate';
import { hashPassword, toSafeUser, type SafeUser } from '../auth/auth.service';
import { User, type UserDocument } from '../auth/user.model';
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
} from './user.validation';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function assertEmailAvailable(email: string, excludeId?: string): Promise<void> {
  const existing = await User.findOne({
    email,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).select('_id');

  if (existing) {
    throw ApiError.conflict('An account with this email address already exists');
  }
}

function technicianValues(role: Role, input: CreateUserInput | UpdateUserInput) {
  if (role !== 'TECHNICIAN') {
    return { specializations: [], skills: [], availability: undefined };
  }

  return {
    specializations: input.specializations ?? [],
    skills: input.skills ?? [],
    availability: input.availability ?? 'AVAILABLE',
  };
}

export async function listUsers(query: ListUsersQuery): Promise<{
  data: SafeUser[];
  page: number;
  limit: number;
  total: number;
}> {
  const { page, limit } = parsePagination(query);
  const filter: Record<string, unknown> = {};

  if (query.role) {
    filter.role = query.role;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  if (query.q) {
    const pattern = new RegExp(escapeRegExp(query.q), 'i');
    filter.$or = [
      { name: pattern },
      { email: pattern },
      { department: pattern },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return paginate(users.map(toSafeUser), page, limit, total);
}

export async function getUser(id: string): Promise<SafeUser> {
  const user = await User.findById(id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return toSafeUser(user);
}

async function logUserChange(
  actorId: string,
  action: string,
  user: UserDocument,
  metadata: Record<string, unknown>,
): Promise<void> {
  await logActivity({
    actorId,
    action,
    entityType: 'User',
    entityId: user._id,
    description: `${action === 'USER_CREATED' ? 'Created' : 'Updated'} ${user.role.toLowerCase()} account ${user.name} (${user.email})`,
    metadata,
  });
}

export async function createUser(
  actorId: string,
  input: CreateUserInput,
): Promise<SafeUser> {
  await assertEmailAvailable(input.email);

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
    department: input.department,
    contactPhone: input.contactPhone,
    isActive: true,
    ...technicianValues(input.role, input),
  });

  await logUserChange(actorId, 'USER_CREATED', user, {
    role: user.role,
    department: user.department,
  });

  return toSafeUser(user);
}

export async function updateUser(
  actorId: string,
  id: string,
  input: UpdateUserInput,
): Promise<SafeUser> {
  const user = await User.findById(id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (input.email && input.email !== user.email) {
    await assertEmailAvailable(input.email, id);
    user.email = input.email;
  }

  if (input.name !== undefined) user.name = input.name;
  if (input.department !== undefined) user.department = input.department;
  if (input.contactPhone !== undefined) user.contactPhone = input.contactPhone;

  if (input.role !== undefined) {
    user.role = input.role;
  }

  const effectiveRole = input.role ?? user.role;
  const isTechnician = effectiveRole === 'TECHNICIAN';

  if (isTechnician) {
    if (input.specializations !== undefined) user.specializations = input.specializations;
    if (input.skills !== undefined) user.skills = input.skills;
    if (input.availability !== undefined) user.availability = input.availability;
    else if (!user.availability) user.availability = 'AVAILABLE';
  } else {
    user.specializations = [];
    user.skills = [];
    user.availability = undefined;
  }

  await user.save();

  await logUserChange(actorId, 'USER_UPDATED', user, {
    fields: Object.keys(input),
  });

  return toSafeUser(user);
}

export async function updateUserStatus(
  actorId: string,
  id: string,
  isActive: boolean,
): Promise<SafeUser> {
  const user = await User.findById(id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.isActive !== isActive) {
    user.isActive = isActive;
    await user.save();

    await logUserChange(
      actorId,
      isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      user,
      { isActive },
    );
  }

  return toSafeUser(user);
}
