import { JSX } from "@solidjs/web/jsx-runtime";

export function callEventHandler<E extends Event, N extends HTMLElement, T extends JSX.EventHandlerUnion<N, E, JSX.EventHandler<N, E>>>(handler: T | undefined, event: E & { currentTarget: N; target: Element; }) {
  if (!handler) return;

  if (Array.isArray(handler)) {
    const [fn, data] = handler;
    fn(data, event);
  } else if(typeof handler == "function") {
    handler(event);
  }
}
