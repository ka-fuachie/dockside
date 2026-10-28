import { ComponentProps } from "@solidjs/web"
import { cn } from "cn"
import { omit } from "solid-js"

function Skeleton(props: ComponentProps<"div">) {
  const otherProps = omit(props, "class")
  return (
    <div
      data-slot="skeleton"
      class={cn("animate-pulse rounded-md bg-muted", props.class)}
      {...otherProps}
    />
  )
}

export { Skeleton }
