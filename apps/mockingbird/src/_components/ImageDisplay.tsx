import { getImage } from '@/_apiServices/images';
import { ImageId } from '@/_types/images';

interface Props {
  imageId: ImageId | undefined | null;
}

export async function ImageDisplay({ imageId }: Props) {
  if (!imageId) {
    return <div></div>;
  }

  const image = await getImage(imageId);

  return (
    <div>
      <img src={image?.imageUrl} />
    </div>
  );
}
