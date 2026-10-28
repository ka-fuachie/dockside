import { ArrowLeftIcon } from "@lucide/solid";
import { ComponentProps } from "@solidjs/web";
import { JSX } from "@solidjs/web/jsx-runtime";
import { buttonVariants } from "@/components/ui/button";
import { omit } from "solid-js";
import { cn } from "cn";

export function PageBody(props: { children: JSX.Element }) {
  return (
    <div
      class="[--body-min-padding-inline:1rem] sm:[--body-min-padding-inline:2rem] px-(--body-padding-inline) py-12 grid gap-6 sm:gap-8"
      style={{
        "--body-max-width": "60rem",
        "--body-padding-inline": "max(calc((100vw - var(--body-max-width))/2), var(--body-min-padding-inline))"
      }}
    >{props.children}</div>
  )
}

export function PageHeader(props: { children: JSX.Element }) {
  return (
    <header class="flex justify-between items-center gap-8">{props.children}</header>
  )
}

export function PageBackLink(props: ComponentProps<"a">) {
  const otherProps = omit(props, "class", "children")
  return (
    <a
      class={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "text-muted-foreground px-2",
        props.class
      )}
      {...otherProps}
    >
      <ArrowLeftIcon />
      <span>{props.children}</span>
    </a>
  )
}

export function PageTitle(props: ComponentProps<"h2">) {
  const otherProps = omit(props, "class", "children")
  return (
    <h2 class={cn("text-4xl sm:text-5xl", props.class)} {...otherProps}>{props.children}</h2>
  )
}

export function PageDescription(props: ComponentProps<"p">) {
  const otherProps = omit(props, "class", "children")
  return (
    <p class={cn("text-muted-foreground", props.class)} {...otherProps}>{props.children}</p>
  )
}

export function PageHeaderActions(props: { children: JSX.Element }) {
  return (
    <div class="flex items-center gap-4">{props.children}</div>
  )
}

export function PageContent(props: ComponentProps<"div">) {
  const otherProps = omit(props, "class", "children")
  return (
    <div class={cn("grid gap-8 sm:gap-12", props.class)} {...otherProps}>{props.children}</div>
  )
}

export function PageSection(props: ComponentProps<"section">) {
  const otherProps = omit(props, "class", "children")
  return (
    <section class={cn("grid gap-3", props.class)} {...otherProps}>{props.children}</section>
  )
}

export function PageSectionTitle(props: ComponentProps<"h3">) {
  const otherProps = omit(props, "class", "children")
  return (
    <h2 class={cn("text-left", props.class)} {...otherProps}>{props.children}</h2>
  )
}
