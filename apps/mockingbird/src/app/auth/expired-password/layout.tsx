import { AuthShell } from '@/app/auth/_components/AuthShell';

export default async function ExpiredPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell>{children}</AuthShell>;
}
