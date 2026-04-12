import { AuthShell } from '@/app/auth/_components/AuthShell';

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell>{children}</AuthShell>;
}
