import { RouteParams } from '@/app/types';

export default function AuthErrorPage({ searchParams }: RouteParams) {
  return (
    <div className="flex flex-col">
      <div>Auth Error: {searchParams.error}</div>
    </div>
  );
}
