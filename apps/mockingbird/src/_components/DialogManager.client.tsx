'use client';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { PostEditorDialog } from './PostEditorDialog.client';
import { SelectImageDialog } from './SelectImageDialog.client';

type PostEditorOptions = Omit<
  Parameters<typeof PostEditorDialog>[0],
  'onClosed'
>;
type SelectImageOptions = Omit<
  Parameters<typeof SelectImageDialog>[0],
  'onClosed'
>;

export interface DialogManagerState {
  postEditorOptions: PostEditorOptions | undefined;
  showPostEditor(options: PostEditorOptions): void;
  hidePostEditor(): void;

  selectImageOptions: SelectImageOptions | undefined;
  showSelectImage(options: SelectImageOptions): void;
  hideSelectImage(): void;
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
          onSubmitPost={({ content, image: imageFile }) => {
            state.postEditorOptions?.onSubmitPost({
              content,
              image: imageFile,
            });
          }}
          onClosed={() => state.hidePostEditor()}
          originalPost={state.postEditorOptions?.originalPost}
        ></PostEditorDialog>
      )}
      {state.selectImageOptions && (
        <SelectImageDialog
          onImageSelected={({ imageId }) => {
            state.selectImageOptions?.onImageSelected({
              imageId,
            });
          }}
          onClosed={() => state.hideSelectImage()}
        ></SelectImageDialog>
      )}
    </>
  );
}
