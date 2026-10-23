import { ComponentProps } from "@solidjs/web"
import { cva, VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { omit } from "solid-js"
import { merge } from "solid-js"

const buttonVariants = cva(
  "cursor-pointer flex justify-center items-center gap-2 bg-primary text-foreground rounded-full px-4 py-4 font-medium active:scale-99 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        filled: "",
        tonal: "bg-muted",
        outlined: "bg-transparent border border-muted-foreground/30",
      },
      size: {
        base: "",
        sm: "px-4 py-2 gap-2 text-sm [&_svg]:size-4",
        xs: "px-3 py-1 gap-1 text-sm [&_svg]:size-4",
      }
    },
    defaultVariants: {
      variant: "filled",
      size: "base"
    }
  }
)

function Button(props: ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  const mergedProps = merge(
    { type: "button" } as Pick<ComponentProps<"button">, "type">,
    props
  )
  const otherProps = omit(props, "class", "type")

  return (
    <button
      data-slot="button"
      type={mergedProps.type}
      class={cn(buttonVariants({variant: mergedProps.variant, size: mergedProps.size}), mergedProps.class)}
      {...otherProps}
    />
  )
}

export { Button }
