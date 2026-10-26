import { cn } from "cn"
import { omit } from "solid-js"
import { ComponentProps } from "@solidjs/web"

function Badge(props: ComponentProps<"span">) {
  const otherProps = omit(props, "class")

  return (
    <span
      data-slot="badge"
      class={cn("inline-flex items-center align-middle gap-1 px-2 py-0.5 text-xs [&_svg]:size-3 rounded-full bg-buted", props.class)}
      {...otherProps}
    />
  )
}

export { Badge }
