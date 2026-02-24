import { ResetPasswordForm } from './_components/ResetPasswordForm.client';

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token ?? ''} />;
}
