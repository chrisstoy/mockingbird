'use client';

import { createGroup } from '@/_apiServices/groups';
import { CreateGroup, CreateGroupSchema } from '@/_types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

export function CreateGroupForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroup>({
    resolver: zodResolver(CreateGroupSchema),
    defaultValues: { visibility: 'PUBLIC' },
  });

  const onSubmit = async (data: CreateGroup) => {
    const group = await createGroup(data);
    router.push(`/groups/${group.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Flock Name</span>
        </label>
        <input
          {...register('name')}
          className="input input-bordered"
          placeholder="My Flock"
        />
        {errors.name && <span className="text-error text-sm mt-1">{errors.name.message}</span>}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Description <span className="font-normal text-base-content/50">(optional)</span></span>
        </label>
        <textarea
          {...register('description')}
          className="textarea textarea-bordered"
          rows={3}
          placeholder="What is this flock about?"
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Visibility</span>
        </label>
        <select {...register('visibility')} className="select select-bordered">
          <option value="PUBLIC">Public — anyone can join</option>
          <option value="PRIVATE">Private — invite only</option>
        </select>
      </div>

      <button type="submit" className="btn btn-primary mt-2" disabled={isSubmitting}>
        {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : 'Create Flock'}
      </button>
    </form>
  );
}
