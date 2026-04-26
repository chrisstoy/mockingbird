'use client';

import { fetchFromServer } from './fetchFromServer';
import { CreateGroup, Group, UpdateGroup } from '@/_types';

export async function searchGroups(query: string): Promise<Group[]> {
  const res = await fetchFromServer(`/api/groups?q=${encodeURIComponent(query)}`);
  return res.json();
}

export async function createGroup(data: CreateGroup): Promise<Group> {
  const res = await fetchFromServer('/api/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getGroup(groupId: string): Promise<Group> {
  const res = await fetchFromServer(`/api/groups/${groupId}`);
  return res.json();
}

export async function updateGroup(groupId: string, data: UpdateGroup): Promise<Group> {
  const res = await fetchFromServer(`/api/groups/${groupId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function joinGroup(groupId: string): Promise<void> {
  await fetchFromServer(`/api/groups/${groupId}/members`, { method: 'POST' });
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  await fetchFromServer(`/api/groups/${groupId}/members/${userId}`, { method: 'DELETE' });
}

export async function requestToJoinGroup(groupId: string): Promise<void> {
  await fetchFromServer(`/api/groups/${groupId}/requests`, { method: 'POST' });
}

export async function exportGroup(groupId: string): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}/export`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flock-${groupId}-export.json`;
  a.click();
  URL.revokeObjectURL(url);
}
