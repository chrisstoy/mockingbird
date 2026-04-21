'use client';
import Delta from 'quill-delta';
import { ComponentPropsWithoutRef, useEffect } from 'react';
import { useQuill } from 'react-quilljs';
import options from './options';
import { toEditorDelta } from './utils';

export { Delta };

interface Props extends ComponentPropsWithoutRef<'div'> {
  data: string | Delta | undefined | null;
}

export function TextDisplay({ data: content, ...rest }: Props) {
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
      const delta = toEditorDelta(quill, content);
      quill.setContents(delta);
    }
  }, [quill, content]);

  return <div {...rest} ref={quillRef}></div>;
}
