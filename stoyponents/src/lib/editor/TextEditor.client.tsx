'use client';
import { PaperAirplaneIcon, TrashIcon } from '@heroicons/react/20/solid';
import Delta from 'quill-delta';
import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import { useQuill } from 'react-quilljs';
import sanitizeHtml from 'sanitize-html';
import options from './options';

export type EditorDelta = Delta;

export interface EditorAPI {
  /**
   * Inserts the image referenced by the URL at the current locatioin in the editor
   * @param imageUrl location of the image to insert
   */
  insertImage: (imageUrl: string) => void;
}

interface Props {
  initialContent?: string | EditorDelta;
  placeholder?: string;
  readOnly?: boolean;

  onChange?: (value: string) => void;
  onChangeDelta?: (delta: EditorDelta) => void;
  onSubmit?: (canceled?: boolean) => void;
}

export const TextEditor = forwardRef<EditorAPI, Props>(
  (
    {
      initialContent,
      placeholder,
      readOnly = false,

      onChange,
      onChangeDelta,
      onSubmit,
    },
    ref
  ) => {
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
    }, [initialContent, onChange, onChangeDelta, quill]);

    const insertImage = useCallback(
      (imageUrl: string) => {
        if (!quill || !imageUrl) {
          return;
        }

        try {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', imageUrl, 'user');
          quill.setSelection(range.index + 1);
        } catch (error) {
          // TODO - update the error thrown
          console.error('Error uploading image:', error);
        }
      },
      [quill]
    );

    useImperativeHandle(ref, () => ({
      insertImage,
    }));

    return (
      <div className="flex flex-row flex-auto">
        <div
          className="flex-auto"
          data-testid="post-editor"
          ref={quillRef}
        ></div>
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
              <span className="w-4 h-4 tooltip" data-tip="Post">
                <PaperAirplaneIcon></PaperAirplaneIcon>
              </span>
            </button>
          </div>
        )}
      </div>
    );
  }
);
