// ./app/page.tsx

import Link from "next/link";

export default function Home() {
  return (
    <main className="site-main">
      <section className="site-section">
        <div className="wrapper flex flex-col items-center justify-center gap-2">
          <h1 className="text-center text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl dark:text-white">
            Welcome to Live Chat
          </h1>
          <Link href={"/chat/general"} className="btn">
            Start Chatting
          </Link>
        </div>
      </section>
    </main>
  );
}
