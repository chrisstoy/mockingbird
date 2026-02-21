export const PERMISSIONS = [
  'admin:access',
  'users:view',
  'users:edit',
  'users:suspend',
  'users:delete',
  'users:permissions',
  'posts:view_all',
  'posts:delete',
  'system:logs',
  'documents:create',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [...PERMISSIONS],
  MODERATOR: [
    'admin:access',
    'users:view',
    'users:suspend',
    'posts:view_all',
    'posts:delete',
  ],
  EDITOR: ['admin:access', 'documents:create'],
  USER: [],
};

export function computePermissions(
  role: string,
  overrides: { permission: string; granted: boolean }[]
): Permission[] {
  const base = new Set<Permission>(ROLE_PERMISSIONS[role] ?? []);
  for (const o of overrides) {
    if (o.granted) base.add(o.permission as Permission);
    else base.delete(o.permission as Permission);
  }
  return [...base];
}
