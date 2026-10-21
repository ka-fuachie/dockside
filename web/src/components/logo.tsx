import { ComponentProps } from "@solidjs/web";
import { cn } from "cn";
import { omit } from "solid-js";

export default function Logo(props: ComponentProps<"svg">) {
  const otherProps = omit(props, "class")
  return (
    <svg viewBox="0 0 64 64" width="1em" height="1em" class={cn("stroke-3", props.class)} {...otherProps}>
      <circle cx="32" cy="12" r="5" stroke="currentColor" fill="none" />
      <path d="M32 17v37M23 26h18" stroke="currentColor" fill="none" />
      <path class="a" d="M10 34v4c0 10 9 16 22 16s22-6 22-16v-4" stroke="var(--primary)" fill="none" />
      <path d="M10 28l-6.5 9h13zM54 28l-6.5 9h13z" fill="var(--primary)" />
    </svg>
  )
}
