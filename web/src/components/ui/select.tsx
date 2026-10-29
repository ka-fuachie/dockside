import { ComponentProps } from "@solidjs/web"
import { cva, VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { omit } from "solid-js"

const selectVariants = cva(
  "dark:scheme-dark px-4 py-3 rounded-md border border-muted-foreground/30 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50", {
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

function Select(props: ComponentProps<"select"> & VariantProps<typeof selectVariants>) {
  const otherProps = omit(props, "class", "size")
  return (
    <select
      data-slot="select"
      class={cn(selectVariants({size: props.size}), props.class)}
      {...otherProps}
    />
  )
}

export { Select }
