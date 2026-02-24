import { getLatestVersionOfDocument } from '@/_server/documentsService';
import { PrivacyPolicyViewer } from './_components/PrivacyPolicyViewer.client';

export default async function PrivacyPolicyPage() {
  const doc = await getLatestVersionOfDocument('PRIVACY');

  if (!doc) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <p className="text-center text-base-content/60">
              Privacy Policy not available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PrivacyPolicyViewer
      content={doc.content}
      version={doc.version}
      updatedAt={doc.updatedAt}
    />
  );
}
