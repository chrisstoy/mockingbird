import { getDocumentById } from '@/_server/documentsService';
import { DocumentId } from '@/_types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/20/solid';
import { DocumentViewer } from './_components/DocumentViewer.client';

interface PageProps {
  params: Promise<{ docId: string }>;
}

export default async function DocumentViewPage({ params }: PageProps) {
  const { docId } = await params;
  const document = await getDocumentById(docId as DocumentId);

  if (!document) {
    notFound();
  }

  return (
    <div className="max-w-5xl p-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/documents"
          className="inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-base-content mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Documents
        </Link>

        <div className="flex items-baseline gap-4 mb-3">
          <h1 className="text-3xl font-bold tracking-tight text-base-content">
            {document.type === 'TOC' ? 'Terms of Service' : 'Privacy Policy'}
          </h1>
          <div className="badge badge-lg badge-primary font-mono font-semibold">
            v{document.version}
          </div>
          <div className="h-px flex-1 bg-linear-to-r from-base-300 to-transparent" />
        </div>

        <div className="flex items-center gap-6 text-xs text-base-content/50">
          <div>
            <span className="font-medium tracking-wider uppercase text-base-content/40">
              Created:
            </span>{' '}
            {new Date(document.createdAt).toLocaleString()}
          </div>
          <div>
            <span className="font-medium tracking-wider uppercase text-base-content/40">
              Document ID:
            </span>{' '}
            <code className="font-mono text-base-content/60">{document.id}</code>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <DocumentViewer content={document.content} />
    </div>
  );
}
