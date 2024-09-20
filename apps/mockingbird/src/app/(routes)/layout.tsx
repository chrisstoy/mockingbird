import { Header } from '@/_components/Header';

export default async function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex flex-col">
      <Header></Header>
      <div className="justify-center flex flex-auto overflow-y-auto">
        <div className="container max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
