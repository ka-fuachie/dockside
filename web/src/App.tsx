import { Title } from '@solidjs/meta';
import { Loading } from 'solid-js';
import { Router } from './router';
import { ThemeToggle } from './components/theme-toggle';

import './App.css';

export default function App() {
  return (
    <Router>
      {(props) => (
        <>
          <Title>Dockside</Title>
          <Loading fallback={<main class="px-4 py-12">Loading…</main>}>
            {props.children}

            <div class="fixed bottom-0 right-0 p-4 sm:p-8">
              <ThemeToggle />
            </div>
          </Loading>
        </>
      )}
    </Router>
  );
}
