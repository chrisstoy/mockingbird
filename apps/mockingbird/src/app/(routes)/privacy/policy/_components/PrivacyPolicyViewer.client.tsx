'use client';
import ReactMarkdown from 'react-markdown';

interface PrivacyPolicyViewerProps {
  content: string;
  version: number;
  updatedAt: Date;
}

export function PrivacyPolicyViewer({
  content,
  version,
  updatedAt,
}: PrivacyPolicyViewerProps) {
  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Document Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-base-content mb-6 leading-tight">
            Privacy Policy
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
            <ReactMarkdown>{content}</ReactMarkdown>
          </article>
        </div>

        {/* Footer Note */}
        <footer className="mt-16 pt-8 border-t border-base-300/50 text-center">
          <p className="text-xs text-base-content/40 leading-relaxed">
            If you have questions about our privacy practices, please contact
            our support team.
          </p>
        </footer>
      </div>
    </div>
  );
}
