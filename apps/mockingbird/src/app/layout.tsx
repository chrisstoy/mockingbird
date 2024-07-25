import { verifySignedIn } from '@/_services/verifySignedIn';
import './global.css';
import { ErrorBoundary } from 'react-error-boundary';
import { auth } from '@/auth';
import { Header } from '@/_components/Header';
import { SessionProvider } from 'next-auth/react';

async function renderError({ error }: { error: Error }) {
  'use server';
  return (
    <div role="alert">
      <p>Unhandle Error When Loading Page</p>
      <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>
    </div>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <ErrorBoundary fallbackRender={renderError}>
          <SessionProvider session={session}>
            <div className="flex flex-col h-dvh">
              <Header></Header>
              <div className="overflow-y-auto">
                <div className="container justify-center flex">{children}</div>
              </div>
            </div>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
