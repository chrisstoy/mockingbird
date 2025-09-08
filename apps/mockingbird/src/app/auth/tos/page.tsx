import TermsOfService from '@/_components/TermsOfService.client';
import { getLatestVersionOfDocument } from '@/_server/documentsService';
import { UserIdSchema } from '@/_types';
import { StrictBooleanSchema } from '@/_types/type-utilities';
import { signOut } from '@/app/auth/serverFuncs';
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
  const tos = await getLatestVersionOfDocument('TOC');

  const { data: searchParams, error } = SearchParamsSchema.safeParse(
    await _searchParams
  );

  if (error) {
    void signOut('/auth/signin');
    return null;
  }

  return (
    <div className="flex flex-auto justify-center">
      <div className="card card-compact w-96 md:w-full bg-base-100 shadow-xl p-10 m-10 flex flex-col md:flex-row">
        <div className="justify-center flex flex-col flex-auto">
          {tos && (
            <TermsOfService
              newTOS={searchParams?.newTOS ?? false}
              requireAcceptance={
                (searchParams?.requireAcceptance || searchParams?.newTOS) ??
                false
              }
              content={tos.content}
              lastUpdated={tos.updatedAt.toLocaleDateString()}
              tosId={tos.id}
              userId={searchParams?.userId}
            ></TermsOfService>
          )}
        </div>
      </div>
    </div>
  );
}
