import { Header } from '@/_components/Header';
import { auth, signIn, signOut } from '@/auth';
export default async function AppPage() {
  const session = await auth();

  return (
    <div>
      <div>
        <h1>
          <span> Hello there, </span>
          Welcome To Mockingbird 👋
        </h1>
        {session?.user ? (
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <div>Hello User {session.user.name}</div>
            <button type="submit">Sign Out</button>
          </form>
        ) : (
          <form
            action={async () => {
              'use server';
              await signIn();
            }}
          >
            <button type="submit">Sign In</button>
          </form>
        )}
      </div>
    </div>
  );
}
