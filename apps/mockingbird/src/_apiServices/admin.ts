'use client';
import type { UserRole } from '@/_types';
import { fetchFromServer } from './fetchFromServer';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function adminGetUsers(params?: {
  page?: number;
  limit?: number;
  q?: string;
}) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  if (params?.q) sp.set('q', params.q);
  const res = await fetchFromServer(`/admin/users?${sp.toString()}`);
  return res.json();
}

export async function adminGetUser(userId: string) {
  const res = await fetchFromServer(`/admin/users/${userId}`);
  return res.json();
}

export async function adminUpdateUserRole(userId: string, role: UserRole) {
  const res = await fetchFromServer(`/admin/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  return res.json();
}

export async function adminDeleteUser(userId: string) {
  await fetchFromServer(`/admin/users/${userId}`, { method: 'DELETE' });
}

export async function adminSuspendUser(userId: string, reason: string) {
  const res = await fetchFromServer(`/admin/users/${userId}/suspend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return res.json();
}

export async function adminUnsuspendUser(userId: string) {
  const res = await fetchFromServer(`/admin/users/${userId}/suspend`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function adminGetUserPermissions(userId: string) {
  const res = await fetchFromServer(`/admin/users/${userId}/permissions`);
  return res.json();
}

export async function adminSetUserPermissions(
  userId: string,
  overrides: { permission: string; granted: boolean }[]
) {
  await fetchFromServer(`/admin/users/${userId}/permissions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ overrides }),
  });
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export async function adminGetPosts(params?: { page?: number; limit?: number }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const res = await fetchFromServer(`/admin/posts?${sp.toString()}`);
  return res.json();
}

export async function adminDeletePost(postId: string) {
  await fetchFromServer(`/admin/posts/${postId}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

export async function adminGetLogs(params?: {
  date?: string;
  level?: string;
  page?: number;
  limit?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.date) sp.set('date', params.date);
  if (params?.level) sp.set('level', params.level);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const res = await fetchFromServer(`/admin/logs?${sp.toString()}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export async function adminGetAudit(params?: { page?: number; limit?: number }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const res = await fetchFromServer(`/admin/audit?${sp.toString()}`);
  return res.json();
}
