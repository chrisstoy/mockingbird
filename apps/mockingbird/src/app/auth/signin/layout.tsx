import { AuthShell } from '@/app/auth/_components/AuthShell';

export default async function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell>{children}</AuthShell>;
}
