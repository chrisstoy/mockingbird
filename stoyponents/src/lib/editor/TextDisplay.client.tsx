'use client';

import Delta from 'quill-delta';
import { useEffect } from 'react';
import { useQuill } from 'react-quilljs';
import sanitizeHtml from 'sanitize-html';
import options from './options';

export { Delta };

interface Props {
  content: string | Delta | undefined;
}

export function TextDisplay({ content }: Props) {
  const { quill, quillRef } = useQuill({
    ...options,
    readOnly: true,
    modules: {
      ...options.modules,
      toolbar: false,
    },
  });

  useEffect(() => {
    if (quill && content) {
      if (typeof content === 'string') {
        quill.clipboard.dangerouslyPasteHTML(sanitizeHtml(content), 'silent');
      } else {
        quill.setContents(content);
      }
    }
  }, [quill, content]);

  return <div ref={quillRef}></div>;
}