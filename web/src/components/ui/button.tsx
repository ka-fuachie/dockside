import { ComponentProps } from "@solidjs/web"
import { cn } from "cn"
import { omit } from "solid-js"
import { merge } from "solid-js"

function Button(props: ComponentProps<"button">) {
  const mergedProps = merge(
    { type: "button" } as Pick<ComponentProps<"button">, "type">,
    props
  )
  const otherProps = omit(props, "class", "type")

  return (
    <button
      data-slot="button"
      type={mergedProps.type}
      class={cn("cursor-pointer bg-primary text-foreground rounded-full px-4 py-4 font-medium active:scale-99", mergedProps.class)}
      {...otherProps}
    />
  )
}

export { Button }
