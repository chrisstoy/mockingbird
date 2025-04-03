'use client';
import { ImageId } from '@/_types/images';
import { Post } from '@/_types/post';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { PostEditorDialog } from './PostEditorDialog.client';

export interface SubmitPostOptions {
  message: string;
  image?: File | ImageId;
}
interface PostEditorOptions {
  onSubmitPost: (content: SubmitPostOptions) => void;
  originalPost?: Post;
}

export interface DialogManagerState {
  postEditorOptions: PostEditorOptions | undefined;
  showPostEditor(options: PostEditorOptions): void;
  hidePostEditor(): void;
}

export const useDialogManager = create<DialogManagerState>()(
  devtools((set) => ({
    postEditorOpen: undefined,
    showPostEditor: (options) => set({ postEditorOptions: options }),
    hidePostEditor: () => set({ postEditorOptions: undefined }),
  }))
);

export function DialogManager() {
  const state = useDialogManager();

  return (
    <>
      {state.postEditorOptions && (
        <PostEditorDialog
          onSubmitPost={(data) => {
            state.postEditorOptions?.onSubmitPost({
              message: data.content,
              image: data.imageFile,
            });
          }}
          onClosed={() => state.hidePostEditor()}
          originalPost={state.postEditorOptions?.originalPost}
        ></PostEditorDialog>
      )}
    </>
  );
}
