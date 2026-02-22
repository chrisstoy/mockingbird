'use client';
import {
  adminDeleteUser,
  adminSetUserPermissions,
  adminSuspendUser,
  adminUnsuspendUser,
  adminUpdateUserRole,
} from '@/_apiServices/admin';
import type { UserRole } from '@/_types';
import { PERMISSIONS } from '@/_types/permissions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

interface PermissionOverride {
  id: string;
  permission: string;
  granted: boolean;
}

interface Props {
  userId: string;
  currentRole: UserRole;
  currentStatus: UserStatus;
  permissionOverrides: PermissionOverride[];
}

function SectionCard({
  title,
  children,
  danger,
}: {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-box border p-5 ${
        danger ? 'border-error/30 bg-error/5' : 'border-base-300 bg-base-100'
      }`}
    >
      <h3
        className={`text-xs font-semibold tracking-widest uppercase mb-4 ${
          danger ? 'text-error/70' : 'text-base-content/40'
        }`}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

export function UserAdminControls({
  userId,
  currentRole,
  currentStatus,
  permissionOverrides,
}: Props) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(currentRole);
  const [status, setStatus] = useState<UserStatus>(currentStatus);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const overrideMap = Object.fromEntries(
    permissionOverrides.map((o) => [o.permission, o.granted])
  );
  const [permState, setPermState] = useState<Record<string, boolean | null>>(
    overrideMap
  );

  async function handleRoleChange(newRole: UserRole) {
    setSaving(true);
    try {
      await adminUpdateUserRole(userId, newRole);
      setRole(newRole);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleSuspendToggle() {
    setSaving(true);
    try {
      if (status === 'ACTIVE') {
        await adminSuspendUser(userId);
        setStatus('SUSPENDED');
      } else {
        await adminUnsuspendUser(userId);
        setStatus('ACTIVE');
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePermissions() {
    setSaving(true);
    try {
      const overrides = Object.entries(permState)
        .filter(([, v]) => v !== null)
        .map(([permission, granted]) => ({ permission, granted: !!granted }));
      await adminSetUserPermissions(userId, overrides);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await adminDeleteUser(userId);
      router.push('/admin/users');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Role */}
      <SectionCard title="Role">
        <div className="flex items-center gap-3">
          <select
            className="select select-bordered select-sm w-full max-w-xs"
            value={role}
            onChange={(e) => handleRoleChange(e.target.value as UserRole)}
            disabled={saving}
          >
            {(['USER', 'EDITOR', 'MODERATOR', 'SUPER_ADMIN'] as const).map(
              (r) => (
                <option key={r} value={r}>
                  {r.replace('_', ' ')}
                </option>
              )
            )}
          </select>
          {saving && <span className="loading loading-spinner loading-xs" />}
        </div>
      </SectionCard>

      {/* Suspension */}
      <SectionCard title="Account Status">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`badge badge-sm ${
                status === 'ACTIVE'
                  ? 'badge-success'
                  : status === 'SUSPENDED'
                    ? 'badge-warning'
                    : 'badge-error'
              }`}
            >
              {status}
            </span>
            <span className="text-sm text-base-content/50">current status</span>
          </div>
          <button
            className={`btn btn-sm ${status === 'ACTIVE' ? 'btn-warning' : 'btn-success'}`}
            onClick={handleSuspendToggle}
            disabled={saving || status === 'DELETED'}
          >
            {saving ? (
              <span className="loading loading-spinner loading-xs" />
            ) : status === 'ACTIVE' ? (
              'Suspend'
            ) : (
              'Unsuspend'
            )}
          </button>
        </div>
      </SectionCard>

      {/* Permission overrides */}
      <SectionCard title="Permission Overrides">
        <p className="text-xs text-base-content/50 mb-4">
          Overrides add or remove permissions beyond the user&apos;s role
          defaults.
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {PERMISSIONS.map((perm) => {
            const val = permState[perm];
            return (
              <label
                key={perm}
                className="flex items-center gap-2 text-sm cursor-pointer group"
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={val === true}
                  onChange={(e) =>
                    setPermState((prev) => ({
                      ...prev,
                      [perm]: e.target.checked ? true : null,
                    }))
                  }
                />
                <span className="font-mono text-xs text-base-content/60 group-hover:text-base-content transition-colors">
                  {perm}
                </span>
              </label>
            );
          })}
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSavePermissions}
          disabled={saving}
        >
          {saving ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            'Save Overrides'
          )}
        </button>
      </SectionCard>

      {/* Danger zone */}
      <SectionCard title="Danger Zone" danger>
        {!showDeleteConfirm ? (
          <button
            className="btn btn-error btn-sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete User
          </button>
        ) : (
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-sm font-medium">
              Permanently delete this account?
            </span>
            <button
              className="btn btn-error btn-sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                'Yes, Delete'
              )}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
