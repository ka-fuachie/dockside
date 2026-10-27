import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { httpStatus } from '@solidjs/web';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { buttonVariants } from '@/components/ui/button';
import { paths } from '@/router';
import Logo from '@/components/logo';
import { cn } from 'cn';

// The catch-all route. httpStatus() is a no-op in the browser and takes
// effect when SSR is enabled; it runs in preload so the status code is set
// before the response head flushes.
export const route = {
  preload: () => httpStatus(404),
} satisfies RouteDefinition;

export default function NotFound() {
  return (
    <main class="flex min-h-screen items-center justify-center px-4">
      <Title>404 - Not Found</Title>
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <Logo class="size-12" />
          </EmptyMedia>
          <EmptyTitle class="text-4xl">404 - Not Found</EmptyTitle>
          <EmptyDescription class="text-base">
            The page you are looking for does not exist.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <a href={paths.sites()} class={cn(buttonVariants({ size: "sm" }))}>
            Go home
          </a>
        </EmptyContent>
      </Empty>
    </main>
  );
}
