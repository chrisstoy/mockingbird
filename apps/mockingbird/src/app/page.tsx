import Image from 'next/image';

export default function Index() {
  return (
    <div>
      <div className="wrapper">
        <div className="container">
          <div id="welcome">
            <h1>
              <span> Hello there, </span>
              Welcome To Mockingbird 👋
              <Image
                src="/mockingbird-white.png"
                alt="Mockingbird Logo"
                width={72}
                height={72}
              />
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
