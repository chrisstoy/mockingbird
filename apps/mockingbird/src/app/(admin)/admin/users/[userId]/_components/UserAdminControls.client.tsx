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
    <div className="space-y-6">
      {/* Role */}
      <div className="card bg-base-200">
        <div className="card-body p-4">
          <h3 className="card-title text-base">Role</h3>
          <select
            className="select select-bordered select-sm w-full max-w-xs"
            value={role}
            onChange={(e) => handleRoleChange(e.target.value as UserRole)}
            disabled={saving}
          >
            {['USER', 'EDITOR', 'MODERATOR', 'SUPER_ADMIN'].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Suspension */}
      <div className="card bg-base-200">
        <div className="card-body p-4 flex-row items-center justify-between">
          <div>
            <h3 className="font-semibold">Account Status</h3>
            <p className="text-sm text-base-content/70">
              Current:{' '}
              <span
                className={
                  status === 'ACTIVE' ? 'text-success' : 'text-warning'
                }
              >
                {status}
              </span>
            </p>
          </div>
          <button
            className={`btn btn-sm ${status === 'ACTIVE' ? 'btn-warning' : 'btn-success'}`}
            onClick={handleSuspendToggle}
            disabled={saving || status === 'DELETED'}
          >
            {status === 'ACTIVE' ? 'Suspend' : 'Unsuspend'}
          </button>
        </div>
      </div>

      {/* Permission overrides */}
      <div className="card bg-base-200">
        <div className="card-body p-4">
          <h3 className="card-title text-base">Permission Overrides</h3>
          <p className="text-xs text-base-content/60 mb-2">
            Overrides add or remove permissions beyond the user's role defaults.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PERMISSIONS.map((perm) => {
              const val = permState[perm];
              return (
                <label key={perm} className="flex items-center gap-2 text-sm">
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
                  <span className="font-mono text-xs">{perm}</span>
                </label>
              );
            })}
          </div>
          <button
            className="btn btn-primary btn-sm mt-3 self-start"
            onClick={handleSavePermissions}
            disabled={saving}
          >
            Save Overrides
          </button>
        </div>
      </div>

      {/* Delete */}
      <div className="card bg-base-200 border border-error/30">
        <div className="card-body p-4">
          <h3 className="card-title text-base text-error">Danger Zone</h3>
          {!showDeleteConfirm ? (
            <button
              className="btn btn-error btn-sm self-start"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete User
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <span className="text-sm">Are you sure?</span>
              <button
                className="btn btn-error btn-sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
