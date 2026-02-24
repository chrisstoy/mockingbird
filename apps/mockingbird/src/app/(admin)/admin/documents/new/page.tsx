import { NewDocumentForm } from './_components/NewDocumentForm.client';

export default function NewDocumentPage() {
  return (
    <div className="max-w-6xl p-6">
      {/* Page Header */}
      <div className="mb-12">
        <div className="flex items-baseline gap-4 mb-3">
          <h1 className="text-3xl font-bold tracking-tight text-base-content">
            Create New Document
          </h1>
          <div className="h-px flex-1 bg-linear-to-r from-base-300 to-transparent" />
        </div>
        <p className="text-sm text-base-content/60 leading-relaxed max-w-2xl">
          Upload legal documents in Markdown format. Each upload creates a new
          version, preserving document history for compliance and audit purposes.
        </p>
      </div>

      {/* Form */}
      <NewDocumentForm />
    </div>
  );
}
