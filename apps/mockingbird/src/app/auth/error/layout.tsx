import { AuthShell } from '@/app/auth/_components/AuthShell';

export default async function AuthErrorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell>{children}</AuthShell>;
}
