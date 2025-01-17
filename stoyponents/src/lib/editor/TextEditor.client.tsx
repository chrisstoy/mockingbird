'use client';
import { PaperAirplaneIcon, TrashIcon } from '@heroicons/react/20/solid';
import Delta from 'quill-delta';
import { useEffect } from 'react';
import { useQuill } from 'react-quilljs';
import sanitizeHtml from 'sanitize-html';
import options from './options';

interface Props {
  initialContent?: string | Delta;
  placeholder?: string;
  readOnly?: boolean;

  onChange?: (value: string) => void;
  onChangeDelta?: (delta: Delta) => void;
  onSubmit?: (canceled?: boolean) => void;
}

export function TextEditor({
  initialContent,
  placeholder,
  readOnly = false,

  onChange,
  onChangeDelta,
  onSubmit,
}: Props) {
  const { quill, quillRef } = useQuill({
    ...options,
    readOnly,
    placeholder: placeholder ?? 'What do you want to say?',
  });

  useEffect(() => {
    if (quill) {
      quill.on('text-change', (_delta, _oldDelta, source) => {
        if (source === 'user') {
          if (quill.getText().trim().length === 0) {
            return;
          }

          if (onChange) {
            onChange(sanitizeHtml(quill.getSemanticHTML()));
          }

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

  return (
    <div className="flex flex-row flex-auto">
      <div className="flex-auto" data-testid="post-editor" ref={quillRef}></div>
      {onSubmit && (
        <div className="join">
          <button
            className="btn btn-ghost btn-primary"
            onClick={() => onSubmit(true)}
          >
            <span className="w-4 h-4 tooltip" data-tip="Cancel">
              <TrashIcon></TrashIcon>
            </span>
          </button>
          <button
            className="btn btn-ghost btn-primary"
            onClick={() => onSubmit()}
          >
            <span className="w-4 h-4 tooltip" data-tip="Send">
              <PaperAirplaneIcon></PaperAirplaneIcon>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
