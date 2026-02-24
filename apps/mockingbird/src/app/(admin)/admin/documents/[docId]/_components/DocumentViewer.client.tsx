'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface DocumentViewerProps {
  content: string;
}

export function DocumentViewer({ content }: DocumentViewerProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');

  return (
    <div className="space-y-4">
      {/* View Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-base-300">
        <button
          type="button"
          onClick={() => setViewMode('preview')}
          className={`
            px-4 py-2 text-sm font-medium transition-colors relative
            ${
              viewMode === 'preview'
                ? 'text-primary'
                : 'text-base-content/60 hover:text-base-content'
            }
          `}
        >
          Preview
          {viewMode === 'preview' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setViewMode('source')}
          className={`
            px-4 py-2 text-sm font-medium transition-colors relative
            ${
              viewMode === 'source'
                ? 'text-primary'
                : 'text-base-content/60 hover:text-base-content'
            }
          `}
        >
          Markdown Source
          {viewMode === 'source' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <div className="ml-auto text-xs text-base-content/40">
          {content.split('\n').length} lines • {(content.length / 1024).toFixed(1)} KB
        </div>
      </div>

      {/* Content Display */}
      {viewMode === 'preview' ? (
        <div className="rounded-xl border border-base-300 bg-base-100 p-8 shadow-sm">
          <article className="prose prose-sm max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </article>
        </div>
      ) : (
        <div className="rounded-xl border border-base-300 bg-base-200/50 p-6">
          <pre className="text-xs font-mono leading-relaxed text-base-content/80 overflow-x-auto">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}
