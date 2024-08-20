import Image from 'next/image';
import { SigninButton } from './_components/SigninButton';

export default async function LoginPage() {
  const providers = [
    {
      id: 'github',
      name: 'GitHub',
      iconSrc: 'https://authjs.dev/img/providers/github.svg',
    },
    // {
    //   id: 'google',
    //   name: 'Google',
    //   iconSrc: 'https://authjs.dev/img/providers/google.svg',
    // },
  ];

  return (
    <div className="flex flex-auto justify-center">
      <div className="card card-compact w-96 bg-base-100 shadow-xl p-10 m-10">
        <h1 className="justify-center">Mockingbird</h1>
        <figure>
          <Image
            src="/mockingbird-dark.png"
            alt="Mockingbird"
            width={256}
            height={256}
          />
        </figure>
        <div className="card-body">
          <h2 className="card-title justify-center">Sign in with...</h2>
          <div className="card-actions flex flex-col items-center">
            {providers.map((provider) => (
              <SigninButton
                key={provider.id}
                id={provider.id}
                name={provider.name}
                imageSrc={provider.iconSrc}
              ></SigninButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
