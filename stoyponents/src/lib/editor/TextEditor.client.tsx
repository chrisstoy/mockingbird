'use client';

import Delta from 'quill-delta';
import { useEffect } from 'react';
import { useQuill } from 'react-quilljs';
import sanitizeHtml from 'sanitize-html';
import options from './options';

interface Props {
  initialContent?: string | Delta;
  placeholder?: string;
  readOnly?: boolean;

  onChange: (value: string) => void;
  onChangeDelta?: (delta: Delta) => void;
}

export function TextEditor({
  initialContent,
  placeholder,
  readOnly = false,

  onChange,
  onChangeDelta,
}: Props) {
  const { quill, quillRef } = useQuill({
    ...options,
    readOnly,
    placeholder: placeholder ?? 'What do you want to say?',
  });

  useEffect(() => {
    if (quill) {
      quill.on('text-change', (delta, oldDelta, source) => {
        if (source === 'user') {
          onChange(sanitizeHtml(quill.getSemanticHTML()));
          if (onChangeDelta) {
            onChangeDelta(quill.getContents());
          }
        }
      });

      if (initialContent) {
        if (typeof initialContent === 'string') {
          quill.clipboard.dangerouslyPasteHTML(
            sanitizeHtml(initialContent),
            'silent'
          );
        } else {
          quill.setContents(initialContent);
        }
      }
    }
  }, [quill]);

  return <div ref={quillRef}></div>;
}
