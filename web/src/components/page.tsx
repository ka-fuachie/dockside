import { JSX } from "@solidjs/web/jsx-runtime";

export function PageContent(props: { children: JSX.Element }) {
  return (
    <div
      class="px-(--content-padding-inline) py-12 grid gap-8"
      style={{
        "--content-max-width": "60rem",
        "--content-min-padding-inline": "2rem",
        "--content-padding-inline": "max(calc((100vw - var(--content-max-width))/2), var(--content-min-padding-inline))"
      }}
    >{props.children}</div>
  )
}

export function PageHeader(props: { children: JSX.Element }) {
  return (
    <header class="flex justify-between items-center gap-8">{props.children}</header>
  )
}

export function PageTitle(props: { children: JSX.Element }) {
  return (
    <h2 class="text-5xl">{props.children}</h2>
  )
}

export function PageDescription(props: { children: JSX.Element }) {
  return (
    <p class="text-muted">{props.children}</p>
  )
}

export function PageHeaderActions(props: { children: JSX.Element }) {
  return (
    <div class="flex items-center gap-4">{props.children}</div>
  )
}
