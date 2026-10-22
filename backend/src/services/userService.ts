import bcrypt from "bcrypt";
import {
  findUserById,
  findUserPasswordHash,
  updateUserFullName,
  updateUserPassword,
  findAllUsers,
  updateUserRole,
  setUserBlocked,
} from "../repositories/userRepository";
import { revokeAllUserRefreshTokens } from "../repositories/tokenRepository";

export async function getMyProfile(userId: string) {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return user;
}

export async function changeMyProfile(
  userId: string,
  fullName: string,
) {
  const user = await updateUserFullName(userId, fullName);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return user;
}

export async function changeMyPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const passwordHash = await findUserPasswordHash(userId);

  if (!passwordHash) {
    throw new Error("USER_NOT_FOUND");
  }

  const isValid = await bcrypt.compare(currentPassword, passwordHash);

  if (!isValid) {
    throw new Error("INVALID_CURRENT_PASSWORD");
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  const updated = await updateUserPassword(userId, newHash);

  if (!updated) {
    throw new Error("USER_NOT_FOUND");
  }

  await revokeAllUserRefreshTokens(userId);
}

export async function listUsers() {
  return findAllUsers();
}

export async function changeUserRole(
  targetUserId: string,
  role: string,
  managerId: string,
) {
  if (targetUserId === managerId) {
    throw new Error("CANNOT_CHANGE_OWN_ROLE");
  }

  const updated = await updateUserRole(targetUserId, role);

  if (!updated) {
    throw new Error("USER_NOT_FOUND_OR_INVALID_ROLE");
  }

  await revokeAllUserRefreshTokens(targetUserId);

  return findUserById(targetUserId);
}

export async function changeUserBlockedStatus(
  targetUserId: string,
  isBlocked: boolean,
  managerId: string,
) {
  if (targetUserId === managerId && isBlocked) {
    throw new Error("CANNOT_BLOCK_SELF");
  }

  const updated = await setUserBlocked(targetUserId, isBlocked);

  if (!updated) {
    throw new Error("USER_NOT_FOUND");
  }

  if (isBlocked) {
    await revokeAllUserRefreshTokens(targetUserId);
  }

  return findUserById(targetUserId);
}