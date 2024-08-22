import { Header } from '@/_components/Header';

export default async function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header></Header>
      <div className="overflow-y-auto flex justify-center">
        <div className="container justify-center flex">{children}</div>
      </div>
    </>
  );
}
