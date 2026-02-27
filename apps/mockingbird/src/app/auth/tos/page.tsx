import { getLatestVersionOfDocument } from '@/_server/documentsService';
import { UserIdSchema } from '@/_types';
import { StrictBooleanSchema } from '@/_types/type-utilities';
import { auth } from '@/app/auth';
import { signOut } from '@/app/auth/serverFuncs';
import { TOSViewer } from '@/app/(routes)/privacy/tos/_components/TOSViewer.client';
import { RouteParams } from '@/app/types';
import { z } from 'zod';

const SearchParamsSchema = z.object({
  userId: UserIdSchema.optional(),
  newTOS: StrictBooleanSchema.optional(),
  requireAcceptance: StrictBooleanSchema.optional(),
});

export default async function TOSPage({
  searchParams: _searchParams,
}: RouteParams) {
  const [tos, session] = await Promise.all([
    getLatestVersionOfDocument('TOC'),
    auth(),
  ]);

  const { data: searchParams, error } = SearchParamsSchema.safeParse(
    await _searchParams
  );

  if (error) {
    void signOut('/auth/signin');
    return null;
  }

  const userId =
    searchParams?.userId ??
    UserIdSchema.safeParse(session?.user?.id).data;
  const requiresTOS = (session?.user as { requiresTOS?: boolean })?.requiresTOS;
  const requireAcceptance =
    searchParams?.requireAcceptance ?? requiresTOS ?? false;
  const newTOS = searchParams?.newTOS ?? false;

  if (!tos) return null;

  return (
    <TOSViewer
      newTOS={newTOS}
      requireAcceptance={requireAcceptance || newTOS}
      content={tos.content}
      version={tos.version}
      updatedAt={tos.updatedAt}
      tosId={tos.id}
      userId={userId}
    />
  );
}
