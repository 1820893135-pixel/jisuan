import { randomUUID } from "node:crypto";
import { db } from "../db/client.js";
import type { AppUser } from "../types.js";

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

const findByUsernameStatement = db.prepare(
  "SELECT id, username, password_hash, created_at FROM users WHERE username = ?",
);

const findByIdStatement = db.prepare(
  "SELECT id, username, password_hash, created_at FROM users WHERE id = ?",
);

const createUserStatement = db.prepare(`
  INSERT INTO users (id, username, password_hash, created_at)
  VALUES (@id, @username, @passwordHash, @createdAt)
`);

const updateUsernameStatement = db.prepare(`
  UPDATE users
  SET username = @username
  WHERE id = @userId
`);

const updatePasswordHashStatement = db.prepare(`
  UPDATE users
  SET password_hash = @passwordHash
  WHERE id = @userId
`);

function mapUser(row: UserRow): AppUser {
  return {
    id: row.id,
    username: row.username,
    createdAt: row.created_at,
  };
}

export function findUserByUsername(username: string) {
  const row = findByUsernameStatement.get(username) as UserRow | undefined;

  if (!row) {
    return null;
  }

  return {
    user: mapUser(row),
    passwordHash: row.password_hash,
  };
}

export function findUserById(userId: string) {
  const row = findByIdStatement.get(userId) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function findUserAuthById(userId: string) {
  const row = findByIdStatement.get(userId) as UserRow | undefined;

  if (!row) {
    return null;
  }

  return {
    user: mapUser(row),
    passwordHash: row.password_hash,
  };
}

export function createUser(username: string, passwordHash: string) {
  const user: AppUser = {
    id: randomUUID(),
    username,
    createdAt: new Date().toISOString(),
  };

  createUserStatement.run({
    id: user.id,
    username: user.username,
    passwordHash,
    createdAt: user.createdAt,
  });

  return user;
}

export function updateUsernameById(userId: string, username: string) {
  updateUsernameStatement.run({
    userId,
    username,
  });

  return findUserById(userId);
}

export function updatePasswordHashById(userId: string, passwordHash: string) {
  updatePasswordHashStatement.run({
    userId,
    passwordHash,
  });
}
