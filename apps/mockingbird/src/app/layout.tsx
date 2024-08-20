import { auth } from '@/app/auth';
import { SessionProvider } from 'next-auth/react';
import { ErrorBoundary } from 'react-error-boundary';
import './global.css';

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
            <div className="flex flex-col h-dvh">{children}</div>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
