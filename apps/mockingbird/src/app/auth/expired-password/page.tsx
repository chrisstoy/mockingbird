import { ExpiredPasswordForm } from './_components/ExpiredPasswordForm.client';

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function ExpiredPasswordPage({ searchParams }: Props) {
  const { email } = await searchParams;
  return <ExpiredPasswordForm email={email ?? ''} />;
}
