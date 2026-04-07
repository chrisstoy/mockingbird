import { DialogManager } from '@/_components/DialogManager.client';
import { auth } from '@/app/auth';
import { Manrope } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { Suspense } from 'react';
import { AppErrorBoundary } from './AppErrorBoundary.client';
import './global.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className={manrope.variable}>
      <body className="min-h-screen bg-base-100">
        <AppErrorBoundary>
          <SessionProvider session={session}>
            <div className="w-full min-h-screen bg-base-100">
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
