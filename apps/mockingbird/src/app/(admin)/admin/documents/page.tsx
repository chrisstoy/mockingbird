import { getAllDocumentsOfType } from '@/_server/documentsService';
import Link from 'next/link';

export default async function AdminDocumentsPage() {
  const [tocDocs, privacyDocs] = await Promise.all([
    getAllDocumentsOfType('TOC'),
    getAllDocumentsOfType('PRIVACY'),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Documents</h1>
        <Link href="/admin/documents/new" className="btn btn-primary btn-sm">
          + New Document
        </Link>
      </div>

      <h2 className="text-lg font-semibold mb-2">Terms of Service</h2>
      <DocumentTable docs={tocDocs} />

      <h2 className="text-lg font-semibold mt-6 mb-2">Privacy Policy</h2>
      <DocumentTable docs={privacyDocs} />
    </div>
  );
}

function DocumentTable({
  docs,
}: {
  docs: { id: string; version: number; createdAt: Date; type: string }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="table table-sm">
        <thead>
          <tr>
            <th>Version</th>
            <th>Type</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => (
            <tr key={doc.id}>
              <td>v{doc.version}</td>
              <td>
                <span className="badge badge-outline text-xs">{doc.type}</span>
              </td>
              <td className="text-xs">
                {new Date(doc.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {docs.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center text-base-content/50">
                No documents
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
