'use client';
import { getUser } from '@/_apiServices/users';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { type ImageId } from '@/_types/images';
import { type Post } from '@/_types/post';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
import {
  DialogActions,
  DialogBody,
  DialogButton,
  DialogHeader,
  type EditorDelta,
  TextEditor,
} from '@mockingbird/stoyponents';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AddToPostOptions } from './AddToPostOptions.client';
import { ImageView } from './ImageView.client';
import { PostView } from './PostView';
import { SelectExistingImage } from './SelectExistingImage.client';

type Props = {
  onSubmitPost: ({
    content,
    image,
  }: {
    content: string;
    image?: File | ImageId;
  }) => void;
  onClosed: () => void;
  originalPost?: Post;
};

export type SubmitPostParams = Parameters<Props['onSubmitPost']>[0];

export function PostEditorDialog({
  onSubmitPost,
  onClosed,
  originalPost,
}: Props) {
  const user = useSessionUser();

  const dialogRef = useRef<HTMLDialogElement>(null);

  const [newContent, setNewContent] = useState<EditorDelta>();

  const [imageFile, setImageFile] = useState<File>();
  const [imageUrl, setImageUrl] = useState<string>();
  const [imageId, setImageId] = useState<ImageId>();

  const [isPickingImage, setIsPickingImage] = useState(false);

  const [posterInfo, setPosterInfo] = useState<{
    userName: string;
    imageSrc: string;
  }>({
    userName: 'Unknown',
    imageSrc: GENERIC_USER_IMAGE_URL,
  });

  // release the url when the component unmounts
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  // if there is an original post, get the poster's info
  useEffect(() => {
    if (originalPost) {
      (async () => {
        const poster = await getUser(originalPost.posterId);
        setPosterInfo({
          userName: poster?.name ?? 'Unknown',
          imageSrc: poster?.image ?? GENERIC_USER_IMAGE_URL,
        });
      })();
    }
  }, [originalPost]);

  // open the dialog and close it automatically
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      dialog?.close();
    };
  }, []);

  const handleSubmitPost = useCallback(async () => {
    if (!user) {
      return;
    }

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    const content = JSON.stringify(newContent ?? { ops: [] });
    onSubmitPost({ content, image: imageFile ?? imageId });
  }, [user, imageFile, imageUrl, imageId, newContent, onSubmitPost]);

  const handleImageSelected = useCallback(
    (file: File) => {
      setImageId(undefined);
      setImageFile(file);
      setImageUrl((oldUrl) => {
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl);
        }
        return URL.createObjectURL(file);
      });
    },
    [setImageFile, setImageUrl, setImageId]
  );

  const handleRemoveImage = useCallback(() => {
    setImageFile(undefined);
    setImageUrl(undefined);
    setImageId(undefined);
  }, [setImageFile, setImageUrl, setImageId]);

  const handleExistingImageSelected = useCallback(
    (imageId: ImageId | undefined) => {
      setImageId(imageId);
      if (imageId) {
        setImageFile(undefined);
        setImageUrl(undefined);
      }
      setIsPickingImage(false);
    },
    [setImageFile, setImageUrl]
  );

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-2xl h-full md:h-[90%] bg-transparent backdrop:backdrop-brightness-50"
    >
      <div className="flex flex-col h-full">
        <DialogHeader
          title={
            originalPost ? `${posterInfo.userName}'s Post` : `Create a Post`
          }
          onClosed={onClosed}
        ></DialogHeader>
        <DialogBody>
          {isPickingImage ? (
            <SelectExistingImage
              onImageSelected={handleExistingImageSelected}
            ></SelectExistingImage>
          ) : (
            <div className="h-full flex flex-col">
              <div className="h-[1px] flex flex-col flex-auto overflow-scroll">
                {originalPost && (
                  <PostView
                    posterInfo={posterInfo}
                    post={originalPost}
                  ></PostView>
                )}

                <ImageView
                  imageUrl={imageUrl}
                  imageId={imageId}
                  onRemoveImage={handleRemoveImage}
                ></ImageView>
                <TextEditor onChangeDelta={setNewContent}></TextEditor>
              </div>
              <AddToPostOptions
                onImageSelected={handleImageSelected}
                onPickImage={() => setIsPickingImage(true)}
                disableImageSelection={!!imageFile || !!imageId}
              ></AddToPostOptions>
            </div>
          )}
        </DialogBody>
        <DialogActions
          onClosed={() => {
            // do nothing
          }}
        >
          <DialogButton
            disabled={!newContent && !imageFile && !imageId}
            onClick={handleSubmitPost}
          >
            Post
          </DialogButton>
        </DialogActions>
      </div>
    </dialog>
  );
}
