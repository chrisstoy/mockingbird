import { getGroupById, getGroupMemberRole } from '@/_server/groupService';
import { sessionUser } from '@/_hooks/sessionUser';
import { GroupIdSchema, GroupRole, UserIdSchema } from '@/_types';
import { notFound, redirect } from 'next/navigation';
import { GroupSettingsForm } from './_components/GroupSettingsForm.client';

type Props = { params: Promise<{ groupId: string }> };

export default async function GroupSettingsPage({ params }: Props) {
  const { groupId } = await params;
  const user = await sessionUser();
  if (!user) redirect('/auth/signin');

  const userId = UserIdSchema.parse(user.id);
  const gid = GroupIdSchema.parse(groupId);

  const group = await getGroupById(gid);
  if (!group) notFound();

  const role = await getGroupMemberRole(gid, userId);
  if (role !== 'ADMIN' && role !== 'OWNER') redirect(`/groups/${groupId}`);

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold tracking-tight px-1">Flock Settings</h1>
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-6">
        <GroupSettingsForm group={group} myRole={role as GroupRole} />
      </div>
    </div>
  );
}
