import {
  getDocumentById,
  getLatestVersionOfDocument,
} from '@/_server/documentsService';
import { getUserById } from '@/_server/usersService';
import { UserIdSchema } from '@/_types';
import { auth } from '@/app/auth';
import TermsOfService from '../../../../_components/TermsOfService.client';

export default async function ViewTOSPage() {
  const session = await auth();

  const { data: userId } = UserIdSchema.safeParse(session?.user?.id);

  const userInfo = userId ? await getUserById(userId) : null;

  const tos = userInfo?.acceptedToS
    ? await getDocumentById(userInfo.acceptedToS)
    : await getLatestVersionOfDocument('TOC');

  return (
    <div className="flex flex-col flex-auto gap-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {tos && (
            <TermsOfService
              newTOS={false}
              requireAcceptance={false}
              content={tos.content}
              lastUpdated={tos.updatedAt.toLocaleDateString()}
              tosId={tos.id}
              userId={userId}
            ></TermsOfService>
          )}
        </div>
      </div>
    </div>
  );
}
