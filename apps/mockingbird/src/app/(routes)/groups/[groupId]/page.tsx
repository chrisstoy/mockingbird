import { getGroupById, getGroupMemberRole, getGroupMembers } from '@/_server/groupService';
import { sessionUser } from '@/_hooks/sessionUser';
import { GroupIdSchema, GroupRole, UserIdSchema } from '@/_types';
import { SkeletonSummaryPost } from '@/_components/SkeletonSummaryPost';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AuditLogTab } from './_components/AuditLogTab';
import { GroupFeed } from './_components/GroupFeed';
import { GroupHeader } from './_components/GroupHeader';
import { GroupJoinButton } from './_components/GroupJoinButton.client';
import { GroupPostComposer } from './_components/GroupPostComposer.client';
import { InvitesTab } from './_components/InvitesTab.client';
import { RequestsTab } from './_components/RequestsTab.client';

type Props = { params: Promise<{ groupId: string }> };

export default async function GroupPage({ params }: Props) {
  const { groupId } = await params;
  const user = await sessionUser();
  if (!user) redirect('/auth/signin');

  const userId = UserIdSchema.parse(user.id);
  const gid = GroupIdSchema.parse(groupId);

  const group = await getGroupById(gid);
  if (!group) notFound();

  const members = await getGroupMembers(gid);
  const myRole = await getGroupMemberRole(gid, userId);
  const isMember = !!myRole;
  const isAdmin = myRole === 'ADMIN' || myRole === 'OWNER';

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <GroupHeader group={group} memberCount={members.length} />
          {isAdmin && (
            <Link href={`/groups/${group.id}/settings`} className="btn btn-ghost btn-sm btn-square flex-shrink-0" aria-label="Settings">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          )}
        </div>
        {!isMember && group.status === 'ACTIVE' && (
          <div className="mt-4">
            <GroupJoinButton group={group} />
          </div>
        )}
      </div>

      {isMember && (
        <>
          {/* Post composer */}
          {myRole !== 'LURKER' && group.status === 'ACTIVE' && (
            <GroupPostComposer userId={userId} groupId={gid} />
          )}

          {/* Feed */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold px-1">Posts</h2>
            <Suspense fallback={<div className="flex flex-col gap-4"><SkeletonSummaryPost /><SkeletonSummaryPost /></div>}>
              <GroupFeed userId={userId} groupId={gid} />
            </Suspense>
          </div>

          {/* Members */}
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-5">
            <h2 className="text-lg font-bold mb-3">Members</h2>
            <ul className="flex flex-col gap-2">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  {m.user.image && (
                    <img src={m.user.image} alt={m.user.name} className="w-8 h-8 rounded-full object-cover" />
                  )}
                  <span className="flex-1 font-medium">{m.user.name}</span>
                  <span className="badge badge-ghost badge-xs">{m.role}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin tabs */}
          {isAdmin && (
            <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-5 flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold mb-3">Join Requests</h2>
                <RequestsTab groupId={group.id} />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3">Pending Invites</h2>
                <InvitesTab groupId={group.id} />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3">Audit Log</h2>
                <Suspense fallback={<div className="flex justify-center py-4"><span className="loading loading-spinner loading-sm" /></div>}>
                  <AuditLogTab groupId={group.id} />
                </Suspense>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
