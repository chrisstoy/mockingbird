import { FeedList } from '@/_components/FeedList';
import { NewPost } from '@/_components/NewPost';
import { auth } from '@/auth';

export default async function AppPage() {
  const session = await auth();
  const userName = session?.user?.name ?? 'Guy McFearson';
  const imageSrc = session?.user?.image ?? '/generic-user-icon.jpg';
  const tinyMCEApiKey = process.env.TINYMCE_API_KEY;

  return (
    <div className="flex flex-col">
      <NewPost
        firstName={userName.split(' ')[0]}
        userImageSrc={imageSrc}
        apiKey={tinyMCEApiKey}
      ></NewPost>
      <FeedList></FeedList>
    </div>
  );
}
