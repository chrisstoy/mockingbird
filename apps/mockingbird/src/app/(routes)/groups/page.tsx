import { searchGroups } from '@/_server/groupService';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { GroupSearch } from './_components/GroupSearch.client';

export default async function GroupsPage() {
  const initialGroups = await searchGroups('');

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <UserGroupIcon className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-base-content">Flocks</h1>
        </div>
        <Link href="/groups/new" className="btn btn-primary btn-sm">
          Create a Flock
        </Link>
      </div>
      <GroupSearch initialGroups={initialGroups} />
    </div>
  );
}
