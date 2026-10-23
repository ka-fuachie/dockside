import { ComponentProps } from "@solidjs/web"
import { cn } from "cn"
import { omit } from "solid-js"

function Input(props: ComponentProps<"input">) {
  const otherProps = omit(props, "class", "type")
  return (
    <input
      type={props.type}
      data-slot="input"
      class={cn(
        "dark:scheme-dark px-4 py-3 rounded-md border border-muted-foreground/30",
        props.class
      )}
      {...otherProps}
    />
  )
}

export { Input }
