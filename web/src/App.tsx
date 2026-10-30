import { Title } from '@solidjs/meta';
import { Loading } from 'solid-js';
import { Router } from './router';
import { ThemeToggle } from './components/theme-toggle';

import './App.css';
import { Skeleton } from './components/ui/skeleton';

export default function App() {
  return (
    <Router>
      {(props) => (
        <>
          <Title>Dockside</Title>
          <Loading
            fallback={
              <div>
                <header
                  class="grid grid-cols-[auto_1fr_auto] gap-4 sm:gap-8 border-b border-border"
                  style={{
                    "--padding-inline": "calc(6 * var(--spacing))",
                    "--padding-block": "calc(4 * var(--spacing))"
                  }}
                >
                  <div class="flex items-center gap-2 ps-(--padding-inline) py-(--padding-block)">
                    <Skeleton class="size-10 rounded-full" />
                    <Skeleton class="hidden sm:block h-6 w-24" />
                  </div>
                  <div class="min-w-0">
                    <nav class="h-full flex items-center gap-4">
                      <Skeleton class="h-4 w-12" />
                      <Skeleton class="h-4 w-12" />
                    </nav>
                  </div>
                  <div class="flex items-center gap-2 sm:gap-4 pe-(--padding-inline) py-(--padding-block)">
                    <Skeleton class="h-4 w-20" />
                    <Skeleton class="h-8 w-20 rounded-full" />
                  </div>
                </header>
                <main class="grid px-4 sm:px-8 py-6 sm:py-8" />
              </div>
            }
          >
            {props.children}

            <div class="fixed bottom-0 right-0 p-4 sm:p-8 z-100 pointer-events-none">
              <ThemeToggle class="pointer-events-auto" />
            </div>
          </Loading>
        </>
      )}
    </Router>
  );
}
