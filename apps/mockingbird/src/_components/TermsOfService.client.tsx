'use client';
import { acceptTOS } from '@/_apiServices/users';
import { DocumentIdSchema, UserId, UserIdSchema } from '@/_types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

interface Props {
  content: string;
  requireAcceptance: boolean;
  newTOS: boolean;
  lastUpdated: string;
  tosId: string;
  userId?: UserId;
}

export default function TermsOfService({
  content,
  newTOS,
  requireAcceptance,
  lastUpdated,
  tosId: rawTOSId,
  userId: rawUserId,
}: Props) {
  const [acceptingTOS, setAcceptingTOS] = useState(false);
  const router = useRouter();

  async function handleAccept() {
    const { data: tosId } = DocumentIdSchema.safeParse(rawTOSId);
    const { data: userId } = UserIdSchema.safeParse(rawUserId);

    if (userId && tosId) {
      setAcceptingTOS(true);
      await acceptTOS(userId, tosId);
      router.push('/');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {newTOS && (
        <div className="alert alert-warning shadow-lg justify-center flex">
          <span>A new version of the Terms of Service is available.</span>
        </div>
      )}
      {requireAcceptance && (
        <div className="alert alert-info shadow-lg flex justify-center">
          <div>
            <span>
              You must read and accept the Terms of Service to continue using
              the application.
            </span>
          </div>
        </div>
      )}
      <p className="text-sm text-gray-500">
        Last updated: {lastUpdated || 'Unknown'}
      </p>
      <h1 className="text-3xl">Terms of Service</h1>
      <hr></hr>
      <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{content}</Markdown>
      {requireAcceptance && (
        <div className="alert alert-info shadow-lg flex md:flex-row flex-col justify-center">
          <div>
            You must accept the Terms of Service to continue using the
            application.
          </div>

          <button
            className="btn btn-primary text-primary-content ml-2"
            onClick={handleAccept}
            disabled={acceptingTOS}
          >
            {acceptingTOS ? (
              <span className="loading loading-spinner loading-md"></span>
            ) : (
              'Accept Terms'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
