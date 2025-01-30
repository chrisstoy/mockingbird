'use client';

import { uploadImage } from '@/_apiServices/images';
import { useSessionUser } from '@/_hooks/useSessionUser';
import {
  EditorAPI,
  EditorDelta,
  FileSelectButton,
  TextDisplay,
  TextEditor,
} from '@mockingbird/stoyponents';
import { useCallback, useRef, useState } from 'react';

const originalContent =
  "<p>This is an example of a <strong>BOLD</strong> new Post!</p><p></p><p><em>People didn't think I would do it, but I </em><strong><em><u>DID!</u></em></strong></p><p></p><p>Only one person could do better.</p><p></p>";

export function TestEditor() {
  const [content, setContent] = useState<string | EditorDelta>(originalContent);
  const [delta, setDelta] = useState<EditorDelta>();

  const editorApi = useRef<EditorAPI>(null);

  const user = useSessionUser();

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editorApi.current || !user) {
        return;
      }

      const { imageUrl } = await uploadImage(user.id, file);
      editorApi.current.insertImage(imageUrl);
    },
    [editorApi]
  );

  return (
    <div className="flex flex-col">
      <div className="border-2 border-green-500">
        <TextEditor
          initialContent={originalContent}
          placeholder="What's up?"
          onChange={setContent}
          onChangeDelta={setDelta}
          ref={editorApi}
        ></TextEditor>
        <div className="flex join m-1 p-1 border-2 border-b-2">
          <div className="content-center pr-2">Add...</div>
          <FileSelectButton
            onFileSelected={handleImageUpload}
          ></FileSelectButton>
        </div>
      </div>
      <br />

      <div className="text-lg font-serif border">Content Display</div>
      <TextDisplay data={content}></TextDisplay>
      <br />

      <div className="text-lg font-serif border">HTML Content</div>
      <div dangerouslySetInnerHTML={{ __html: content }}></div>
      <br />

      <div className="text-lg font-serif border">Raw Content</div>
      <div>{JSON.stringify(content)}</div>
      <br />

      <div className="text-lg font-serif border">Raw Delta</div>
      <code>{JSON.stringify(delta, null, 2)}</code>
    </div>
  );
}
