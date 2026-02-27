'use client';
import { acceptTOS } from '@/_apiServices/users';
import { DocumentIdSchema, UserId, UserIdSchema } from '@/_types';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

interface TOSViewerProps {
  content: string;
  version: number;
  updatedAt: Date;
  tosId: string;
  userId?: UserId;
  requireAcceptance: boolean;
  newTOS: boolean;
}

export function TOSViewer({
  content,
  version,
  updatedAt,
  tosId: rawTOSId,
  userId: rawUserId,
  requireAcceptance,
  newTOS,
}: TOSViewerProps) {
  const { update } = useSession();
  const router = useRouter();

  async function handleAccept() {
    const { data: tosId } = DocumentIdSchema.safeParse(rawTOSId);
    const { data: userId } = UserIdSchema.safeParse(rawUserId);

    if (userId && tosId) {
      await acceptTOS(userId, tosId);
      await update();
      router.replace('/');
    }
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Alert Banners */}
        {newTOS && (
          <div className="mb-8 rounded-2xl border-2 border-warning/30 bg-warning/5 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-warning mb-1">
                  Updated Terms Available
                </h3>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  A new version of the Terms of Service has been published.
                  Please review the changes carefully.
                </p>
              </div>
            </div>
          </div>
        )}

        {requireAcceptance && (
          <div className="mb-8 rounded-2xl border-2 border-info/30 bg-info/5 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-info/20 flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-info" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-info mb-1">
                  Acceptance Required
                </h3>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  You must read and accept these Terms of Service to continue
                  using the application.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Document Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-base-content mb-6 leading-tight">
            Terms of Service
          </h1>

          <div className="flex items-center justify-center gap-6 text-sm text-base-content/60">
            <div className="flex items-center gap-2">
              <span className="font-medium text-base-content/40">Version</span>
              <span className="px-3 py-1 rounded-full bg-base-200 font-mono font-semibold text-base-content">
                {version}.0
              </span>
            </div>
            <div className="w-1 h-1 rounded-full bg-base-content/20" />
            <div className="flex items-center gap-2">
              <span className="font-medium text-base-content/40">Updated</span>
              <time className="font-medium text-base-content/70">
                {new Date(updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
          </div>
        </header>

        {/* Document Content */}
        <div className="rounded-xl border border-base-300 bg-base-100 p-8 shadow-sm">
          <article className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {content}
            </ReactMarkdown>
          </article>
        </div>

        {/* Acceptance Section */}
        {requireAcceptance && (
          <div className="mt-16 pt-12 border-t border-base-300">
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-8 shadow-lg backdrop-blur-sm">
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <CheckCircleIcon className="w-8 h-8 text-primary" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-base-content mb-2">
                    Accept Terms to Continue
                  </h3>
                  <p className="text-sm text-base-content/70 max-w-md mx-auto leading-relaxed">
                    By clicking &quot;Accept Terms&quot; below, you acknowledge
                    that you have read, understood, and agree to be bound by
                    these Terms of Service.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAccept}
                  className="btn btn-primary btn-lg px-12 shadow-lg hover:shadow-xl transition-all"
                >
                  Accept Terms
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <footer className="mt-16 pt-8 border-t border-base-300/50 text-center">
          <p className="text-xs text-base-content/40 leading-relaxed">
            If you have questions about these terms, please contact our support
            team.
          </p>
        </footer>
      </div>
    </div>
  );
}
