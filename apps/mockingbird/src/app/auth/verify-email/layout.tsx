import { AuthShell } from '@/app/auth/_components/AuthShell';

export default async function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell>{children}</AuthShell>;
}
