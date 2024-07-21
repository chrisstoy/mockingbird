import { verifySignedIn } from '@/_services/verifySignedIn';
import './global.css';
import { ErrorBoundary } from 'react-error-boundary';
import { auth } from '@/auth';
import { Header } from '@/_components/Header';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  verifySignedIn(session);

  return (
    <html lang="en">
      <body>
        <ErrorBoundary fallback={<div>Something went wrong!</div>}>
          <Header></Header>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
