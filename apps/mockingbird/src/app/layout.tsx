import { DialogManager } from '@/_components/DialogManager.client';
import { auth } from '@/app/auth';
import { SessionProvider } from 'next-auth/react';
import { Suspense } from 'react';
import { AppErrorBoundary } from './AppErrorBoundary.client';
import './global.css';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="h-screen bg-neutral">
        <AppErrorBoundary>
          <SessionProvider session={session}>
            <div className="w-full h-auto bg-neutral">
              <Suspense
                fallback={
                  <span className="loading loading-ball loading-lg"></span>
                }
              ></Suspense>
              {children}
            </div>
            <DialogManager></DialogManager>
          </SessionProvider>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
