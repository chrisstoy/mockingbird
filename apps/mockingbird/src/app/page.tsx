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
        <br></br>
        {session?.user && (
          <div>
            Hello User: <pre>{JSON.stringify(session, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
