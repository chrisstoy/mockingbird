'use client';
import { fetchFromServer } from '@/_apiServices/fetchFromServer';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { DocumentTextIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

type DocumentType = 'TOC' | 'PRIVACY';

interface DocumentTypeOption {
  value: DocumentType;
  label: string;
  description: string;
}

const DOCUMENT_TYPES: DocumentTypeOption[] = [
  {
    value: 'TOC',
    label: 'Terms of Service',
    description: 'Legal agreement between service provider and users',
  },
  {
    value: 'PRIVACY',
    label: 'Privacy Policy',
    description: 'How user data is collected, used, and protected',
  },
];

export function NewDocumentForm() {
  const router = useRouter();
  const [type, setType] = useState<DocumentType>('TOC');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileRead = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
      setFileName(file.name);
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith('.md')) {
        setError('Please select a Markdown (.md) file');
        return;
      }

      handleFileRead(file);
    },
    [handleFileRead]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      if (!file.name.endsWith('.md')) {
        setError('Please select a Markdown (.md) file');
        return;
      }

      handleFileRead(file);
    },
    [handleFileRead]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('content', content);
      await fetchFromServer(`/documents/${type}`, {
        method: 'POST',
        body: formData,
      });
      router.push('/admin/documents');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
      {/* Document Type Selector */}
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-semibold tracking-widest uppercase text-base-content/50 mb-3 block">
            Document Type
          </span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          {DOCUMENT_TYPES.map((docType) => (
            <button
              key={docType.value}
              type="button"
              onClick={() => setType(docType.value)}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-200 text-left
                ${
                  type === docType.value
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-base-300 bg-base-100 hover:border-base-content/20 hover:shadow-sm'
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`
                  shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors
                  ${
                    type === docType.value
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-200 text-base-content/60'
                  }
                `}
                >
                  <DocumentTextIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={`
                    font-semibold text-base mb-1 transition-colors
                    ${type === docType.value ? 'text-primary' : 'text-base-content'}
                  `}
                  >
                    {docType.label}
                  </h3>
                  <p className="text-xs leading-relaxed text-base-content/60">
                    {docType.description}
                  </p>
                </div>
                {type === docType.value && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* File Upload Zone */}
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-semibold tracking-widest uppercase text-base-content/50 mb-3 block">
            Document File
          </span>
        </label>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative rounded-xl border-2 border-dashed transition-all duration-200
            ${
              dragActive
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : content
                  ? 'border-success bg-success/5'
                  : 'border-base-300 bg-base-100 hover:border-base-content/30'
            }
          `}
        >
          <input
            type="file"
            accept=".md"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center py-16 px-8 cursor-pointer"
          >
            {content ? (
              <>
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                  <DocumentTextIcon className="w-8 h-8 text-success" />
                </div>
                <p className="text-base font-semibold text-success mb-2">
                  {fileName}
                </p>
                <p className="text-xs text-base-content/50 mb-4">
                  {content.split('\n').length} lines • {(content.length / 1024).toFixed(1)} KB
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setContent('');
                    setFileName('');
                  }}
                  className="text-xs text-base-content/60 hover:text-base-content underline underline-offset-2"
                >
                  Choose different file
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mb-4">
                  <CloudArrowUpIcon className="w-8 h-8 text-base-content/40" />
                </div>
                <p className="text-base font-semibold text-base-content mb-2">
                  Drop your Markdown file here
                </p>
                <p className="text-xs text-base-content/50 mb-4">
                  or click to browse files
                </p>
                <div className="px-4 py-1.5 rounded-full bg-base-200 text-xs font-medium text-base-content/60">
                  .md files only
                </div>
              </>
            )}
          </label>
        </div>

        {/* Content Preview */}
        {content && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold tracking-widest uppercase text-base-content/50">
                Preview
              </span>
              <span className="text-xs text-base-content/40">
                First 10 lines
              </span>
            </div>
            <div className="rounded-lg bg-base-200/50 border border-base-300 p-4 overflow-hidden">
              <pre className="text-xs font-mono leading-relaxed text-base-content/70 overflow-x-auto">
                {content.split('\n').slice(0, 10).join('\n')}
                {content.split('\n').length > 10 && '\n...'}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg bg-error/10 border border-error/30 p-4">
          <p className="text-sm font-medium text-error">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-base-300">
        {content && (
          <div className="mr-auto text-xs text-base-content/40">
            Ready to publish version 1.0
          </div>
        )}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary px-8"
          disabled={saving || !content}
        >
          {saving ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              Creating Document...
            </>
          ) : (
            'Create Document'
          )}
        </button>
      </div>
    </form>
  );
}
