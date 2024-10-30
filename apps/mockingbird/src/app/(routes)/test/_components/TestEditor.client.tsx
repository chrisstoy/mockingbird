'use client';

import { Delta, TextDisplay, TextEditor } from '@mockingbird/stoyponents';
import { useState } from 'react';

const originalDelta = new Delta({
  ops: [
    { insert: 'This is ' },
    {
      attributes: { bold: true },
      insert: "example <div onClick={alert('hi')}>TEST</div>",
    },
    { insert: ' ' },
    { attributes: { italic: true }, insert: 'text.' },
    { insert: '\n\nFirst' },
    { attributes: { list: 'ordered' }, insert: '\n' },
    { insert: 'Second' },
    { attributes: { list: 'ordered' }, insert: '\n' },
    { insert: 'Alpha' },
    { attributes: { indent: 1, list: 'ordered' }, insert: '\n' },
    { insert: 'Third' },
    { attributes: { list: 'ordered' }, insert: '\n' },
    { insert: '\n' },
  ],
});

const originalContent =
  "<p>This is an example of a <strong>BOLD</strong> new Post!</p><p></p><p><em>People didn't think I would do it, but I </em><strong><em><u>DID!</u></em></strong></p><p></p><p>Only one person could do better.</p><p></p>";

export function TestEditor() {
  const [content, setContent] = useState<string | Delta>(originalContent);
  const [delta, setDelta] = useState<Delta>();

  return (
    <div>
      <TextEditor
        initialContent={originalContent}
        placeholder="What's up?"
        onChange={setContent}
        onChangeDelta={setDelta}
      ></TextEditor>
      <br />
      <TextDisplay content={content}></TextDisplay>
      <br />
      <div>{typeof content === 'string' ? content : ''}</div>
      <br />
      <div dangerouslySetInnerHTML={{ __html: content }}></div>
      <br />
      <div>{JSON.stringify(delta)}</div>
    </div>
  );
}