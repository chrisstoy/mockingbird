import {
  getDocumentById,
  getLatestVersionOfDocument,
} from '@/_server/documentsService';
import { getUserById } from '@/_server/usersService';
import { UserIdSchema } from '@/_types';
import { auth } from '@/app/auth';
import { TOSViewer } from './_components/TOSViewer.client';

export default async function ViewTOSPage() {
  const session = await auth();

  const { data: userId } = UserIdSchema.safeParse(session?.user?.id);

  const userInfo = userId ? await getUserById(userId) : null;

  const tos = userInfo?.acceptedToS
    ? await getDocumentById(userInfo.acceptedToS)
    : await getLatestVersionOfDocument('TOC');

  if (!tos) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <p className="text-center text-base-content/60">
              Terms of Service not available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TOSViewer
      content={tos.content}
      version={tos.version}
      updatedAt={tos.updatedAt}
      tosId={tos.id}
      userId={userId}
      requireAcceptance={false}
      newTOS={false}
    />
  );
}
