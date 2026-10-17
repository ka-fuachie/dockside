import { Title } from '@solidjs/meta';
import logo from '../logo.svg';
import { env } from '../lib/env';

export default function Home() {
  return (
    <main class="px-4 py-12">
      <Title>Home</Title>
      <img
        src={logo}
        class="pointer-events-none mx-auto h-[24vmin] animate-[spin_20s_linear_infinite]"
        alt="Solid logo"
      />
      <h1 class="my-4 text-4xl font-bold">Hello Solid!</h1>
      <p>API url: {env.API_URL}</p>
      <p>Sites base url: {env.SITES_BASE_URL}</p>
    </main>
  );
}
