import { getAllDocumentsOfType } from '@/_server/documentsService';
import Link from 'next/link';

export default async function AdminDocumentsPage() {
  const [tocDocs, privacyDocs] = await Promise.all([
    getAllDocumentsOfType('TOC'),
    getAllDocumentsOfType('PRIVACY'),
  ]);

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-base-content/40 mb-1">
            Legal
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        </div>
        <Link href="/admin/documents/new" className="btn btn-primary btn-sm">
          + New Document
        </Link>
      </div>

      <div className="space-y-8">
        <section>
          <p className="text-xs font-medium tracking-widest uppercase text-base-content/40 mb-3">
            Terms of Service
          </p>
          <DocumentTable docs={tocDocs} />
        </section>

        <section>
          <p className="text-xs font-medium tracking-widest uppercase text-base-content/40 mb-3">
            Privacy Policy
          </p>
          <DocumentTable docs={privacyDocs} />
        </section>
      </div>
    </div>
  );
}

function DocumentTable({
  docs,
}: {
  docs: { id: string; version: number; createdAt: Date; type: string }[];
}) {
  return (
    <div className="overflow-x-auto rounded-box border border-base-300">
      <table className="table table-sm table-zebra w-full">
        <thead>
          <tr className="bg-base-200">
            <th className="text-xs font-semibold tracking-wider uppercase text-base-content/50">Version</th>
            <th className="text-xs font-semibold tracking-wider uppercase text-base-content/50">Type</th>
            <th className="text-xs font-semibold tracking-wider uppercase text-base-content/50">Created</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => (
            <tr key={doc.id} className="hover">
              <td className="font-mono font-medium">v{doc.version}</td>
              <td>
                <span className="badge badge-sm badge-outline text-xs font-mono">
                  {doc.type}
                </span>
              </td>
              <td className="text-xs text-base-content/50">
                {new Date(doc.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {docs.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center text-base-content/40 py-8">
                No documents yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
