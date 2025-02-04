'use client';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { PostEditorDialog } from './PostEditorDialog.client';
import { CommentEditorDialog } from './CommentEditorDialog.client';
import { Post } from '@/_types/post';

interface PostEditorOptions {
  onSubmitPost: (content: string) => void;
}

interface CommentEditorOptions extends PostEditorOptions {
  originalPost: Post;
}

export interface DialogManagerState {
  postEditorOptions: PostEditorOptions | undefined;
  showPostEditor(options: PostEditorOptions): void;
  hidePostEditor(): void;

  commentEditorOptions: CommentEditorOptions | undefined;
  showCommentEditor(options: CommentEditorOptions): void;
  hideCommentEditor(): void;
}

export const useDialogManager = create<DialogManagerState>()(
  devtools((set) => ({
    postEditorOpen: undefined,
    showPostEditor: (options) => set({ postEditorOptions: options }),
    hidePostEditor: () => set({ postEditorOptions: undefined }),

    commentEditorOptions: undefined,
    showCommentEditor: (options) => set({ commentEditorOptions: options }),
    hideCommentEditor: () => set({ commentEditorOptions: undefined }),
  }))
);

export function DialogManager() {
  const state = useDialogManager();

  return (
    <>
      {state.postEditorOptions && (
        <PostEditorDialog
          onSubmitPost={(content) => {
            state.postEditorOptions?.onSubmitPost(content);
          }}
          onClosed={() => state.hidePostEditor()}
        ></PostEditorDialog>
      )}

      {state.commentEditorOptions && (
        <CommentEditorDialog
          originalPost={state.commentEditorOptions.originalPost}
          onSubmitPost={(content) => {
            state.commentEditorOptions?.onSubmitPost(content);
          }}
          onClosed={() => state.hideCommentEditor()}
        ></CommentEditorDialog>
      )}
    </>
  );
}
