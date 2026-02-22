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
import { useState, useRef, useEffect } from 'react';

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
  suspensionReason?: string;
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
  suspensionReason: currentSuspensionReason,
  permissionOverrides,
}: Props) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(currentRole);
  const [status, setStatus] = useState<UserStatus>(currentStatus);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReasonInput, setSuspensionReasonInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const overrideMap = Object.fromEntries(
    permissionOverrides.map((o) => [o.permission, o.granted])
  );
  const [permState, setPermState] = useState<Record<string, boolean | null>>(
    overrideMap
  );

  useEffect(() => {
    if (showSuspendModal && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showSuspendModal]);

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

  async function handleSuspend() {
    if (!suspensionReasonInput.trim()) return;

    setSaving(true);
    try {
      await adminSuspendUser(userId, suspensionReasonInput.trim());
      setStatus('SUSPENDED');
      setShowSuspendModal(false);
      setSuspensionReasonInput('');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleUnsuspend() {
    setSaving(true);
    try {
      await adminUnsuspendUser(userId);
      setStatus('ACTIVE');
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
        <div className="flex items-center justify-between mb-4">
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
            onClick={() =>
              status === 'ACTIVE'
                ? setShowSuspendModal(true)
                : handleUnsuspend()
            }
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

        {/* Suspension Reason Display */}
        {status === 'SUSPENDED' && currentSuspensionReason && (
          <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <svg
                  className="w-5 h-5 text-warning"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold tracking-wider uppercase text-warning/80 mb-1.5">
                  Suspension Reason
                </h4>
                <p className="text-sm leading-relaxed text-base-content/70">
                  {currentSuspensionReason}
                </p>
              </div>
            </div>
          </div>
        )}
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

      {/* Suspension Modal */}
      {showSuspendModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          style={{ animation: 'fadeIn 0.15s ease-out' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSuspendModal(false);
              setSuspensionReasonInput('');
            }
          }}
        >
          <div
            className="bg-base-100 rounded-box border border-base-300 shadow-2xl w-full max-w-lg mx-4"
            style={{
              animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-base-300">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">
                    Suspend Account
                  </h3>
                  <p className="text-xs text-base-content/50 mt-1">
                    Provide a clear explanation for this action
                  </p>
                </div>
                <button
                  className="btn btn-ghost btn-sm btn-square -mt-1 -mr-1"
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSuspensionReasonInput('');
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <label className="block">
                <span className="text-xs font-medium tracking-wider uppercase text-base-content/40 mb-2 block">
                  Reason for Suspension
                </span>
                <textarea
                  ref={textareaRef}
                  className="textarea textarea-bordered w-full min-h-32 text-sm leading-relaxed"
                  placeholder="e.g., Violated community guidelines by posting spam content on multiple occasions..."
                  value={suspensionReasonInput}
                  onChange={(e) => setSuspensionReasonInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey && suspensionReasonInput.trim()) {
                      handleSuspend();
                    }
                  }}
                />
              </label>
              <p className="text-xs text-base-content/40 mt-2">
                This message will be shown to the user when they attempt to log
                in.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-2 flex items-center justify-between gap-3">
              <div className="text-xs text-base-content/40">
                <kbd className="kbd kbd-xs">⌘</kbd> +{' '}
                <kbd className="kbd kbd-xs">↵</kbd> to confirm
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSuspensionReasonInput('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-warning btn-sm"
                  onClick={handleSuspend}
                  disabled={!suspensionReasonInput.trim() || saving}
                >
                  {saving ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    'Suspend Account'
                  )}
                </button>
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
              }
              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
