'use client';

import { exportGroup, updateGroup } from '@/_apiServices/groups';
import { Group, GroupRole, UpdateGroup, UpdateGroupSchema } from '@/_types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

type Props = { group: Group; myRole: GroupRole };

export function GroupSettingsForm({ group, myRole }: Props) {
  const router = useRouter();
  const isOwner = myRole === 'OWNER';
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateGroup>({
    resolver: zodResolver(UpdateGroupSchema),
    defaultValues: {
      name: group.name,
      description: group.description ?? '',
      visibility: group.visibility,
    },
  });

  const onSubmit = async (data: UpdateGroup) => {
    await updateGroup(group.id, data);
    router.refresh();
  };

  const handleToggleStatus = async () => {
    const newStatus = group.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    await updateGroup(group.id, { status: newStatus });
    router.refresh();
  };

  const handleDelete = async () => {
    await fetch(`/api/groups/${group.id}`, { method: 'DELETE' });
    router.push('/groups');
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      await exportGroup(group.id);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Edit form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text font-semibold">Flock Name</span></label>
          <input {...register('name')} className="input input-bordered" />
          {errors.name && <span className="text-error text-sm">{errors.name.message}</span>}
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-semibold">Description</span></label>
          <textarea {...register('description')} className="textarea textarea-bordered" rows={3} />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-semibold">Visibility</span></label>
          <select {...register('visibility')} className="select select-bordered">
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : 'Save Changes'}
        </button>
      </form>

      {/* Owner-only actions */}
      {isOwner && (
        <div className="flex flex-col gap-3 pt-4 border-t border-base-200">
          <h2 className="font-semibold text-base-content/60 text-sm uppercase tracking-widest">Owner Actions</h2>

          <button className="btn btn-outline btn-sm w-fit" onClick={handleExport} disabled={exportLoading}>
            {exportLoading ? <span className="loading loading-spinner loading-xs" /> : 'Export Posts'}
          </button>

          <button
            className={`btn btn-outline btn-sm w-fit ${group.status === 'ACTIVE' ? 'btn-warning' : 'btn-success'}`}
            onClick={handleToggleStatus}
          >
            {group.status === 'ACTIVE' ? 'Disable Flock' : 'Re-enable Flock'}
          </button>

          {group.status === 'DISABLED' && (
            deleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-error">Are you sure? This is permanent.</span>
                <button className="btn btn-error btn-sm" onClick={handleDelete}>Yes, Delete</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(false)}>Cancel</button>
              </div>
            ) : (
              <button className="btn btn-error btn-outline btn-sm w-fit" onClick={() => setDeleteConfirm(true)}>
                Delete Flock
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
