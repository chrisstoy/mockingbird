import TermsOfService from '@/_components/TermsOfService.client';
import { sessionUser } from '@/_hooks/sessionUser';
import { signOut } from '@/_server/auth';
import { getLatestVersionOfDocument } from '@/_server/documentsService';
import { StrictBooleanSchema } from '@/_types/type-utilities';
import { RouteParams } from '@/app/types';
import { redirect, RedirectType } from 'next/navigation';
import { z } from 'zod';

const SearchParamsSchema = z.object({
  newTOS: StrictBooleanSchema.optional(),
  requireAcceptance: StrictBooleanSchema.optional(),
});

export default async function TOSPage({
  searchParams: _searchParams,
}: RouteParams) {
  const tos = await getLatestVersionOfDocument('TOC');
  const user = await sessionUser();

  const { data: searchParams, error } = SearchParamsSchema.safeParse(
    await _searchParams
  );

  if (!user || error) {
    await signOut();
    redirect('/auth/signin?error=invalid_session', RedirectType.replace);
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
              userId={user.id}
            ></TermsOfService>
          )}
        </div>
      </div>
    </div>
  );
}
