import { ComponentProps } from "@solidjs/web"
import { cva, VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { omit } from "solid-js"

const inputVariations = cva(
  "dark:scheme-dark px-4 py-3 rounded-md border border-muted-foreground/30 w-full", {
    variants: {
      size: {
        base: "",
        sm: "[--offset:2px] px-2 py-1"
      }
    },
    defaultVariants: {
      size: "base"
    }
  }
)

function Input(props: ComponentProps<"input"> & VariantProps<typeof inputVariations>) {
  const otherProps = omit(props, "class", "type")
  return (
    <input
      type={props.type}
      data-slot="input"
      class={cn(inputVariations({size: props.size}), props.class)}
      {...otherProps}
    />
  )
}

export { Input }
