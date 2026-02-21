'use client';
import { fetchFromServer } from '@/_apiServices/fetchFromServer';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function NewDocumentForm() {
  const router = useRouter();
  const [type, setType] = useState<'TOC' | 'PRIVACY'>('TOC');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await fetchFromServer(`/documents/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      router.push('/admin/documents');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Document Type</span>
        </label>
        <select
          className="select select-bordered"
          value={type}
          onChange={(e) => setType(e.target.value as 'TOC' | 'PRIVACY')}
        >
          <option value="TOC">Terms of Service (TOC)</option>
          <option value="PRIVACY">Privacy Policy</option>
        </select>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Content (Markdown)</span>
        </label>
        <textarea
          className="textarea textarea-bordered h-64 font-mono text-sm"
          placeholder="Enter document content in Markdown…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>

      {error && <div className="alert alert-error text-sm">{error}</div>}

      <div className="flex gap-2">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving || !content}
        >
          {saving ? 'Creating…' : 'Create Document'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
