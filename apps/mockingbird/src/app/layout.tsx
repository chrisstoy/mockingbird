import { DialogManager } from '@/_components/DialogManager.client';
import { ServiceWorkerRegistration } from '@/_components/ServiceWorkerRegistration.client';
import { ThemeProvider } from '@/_providers/ThemeProvider.client';
import { auth } from '@/app/auth';
import type { Metadata, Viewport } from 'next';
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

export const metadata: Metadata = {
  title: 'Mockingbird',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Mockingbird',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#F49D37',
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className={manrope.variable}>
      <body className="min-h-screen bg-base-100">
        <ServiceWorkerRegistration />
        <AppErrorBoundary>
          <SessionProvider session={session}>
            <ThemeProvider>
              <div className="w-full min-h-screen bg-base-100">
                <Suspense
                  fallback={
                    <span className="loading loading-ball loading-lg"></span>
                  }
                ></Suspense>
                {children}
              </div>
              <DialogManager></DialogManager>
            </ThemeProvider>
          </SessionProvider>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
