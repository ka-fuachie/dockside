import { ComponentProps } from "@solidjs/web"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { merge } from "solid-js"
import { omit } from "solid-js"

function Empty(props: ComponentProps<"div">) {
  const otherProps = omit(props, "class")
  return (
    <div
      data-slot="empty"
      class={cn(
        "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-xl border-dashed p-6 text-center text-balance",
        props.class
      )}
      {...otherProps}
    />
  )
}

function EmptyHeader(props: ComponentProps<"div">) {
  const otherProps = omit(props, "class")
  return (
    <div
      data-slot="empty-header"
      class={cn("flex max-w-sm flex-col items-center gap-2", props.class)}
      {...otherProps}
    />
  )
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function EmptyMedia(props: ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  const mergedProps = merge({ variant: "default" } as VariantProps<typeof emptyMediaVariants>, props)
  const otherProps = omit(mergedProps, "class", "variant")

  return (
    <div
      data-slot="empty-icon"
      data-variant={mergedProps.variant}
      class={cn(emptyMediaVariants({ variant: mergedProps.variant, class: mergedProps.class }))}
      {...otherProps}
    />
  )
}

function EmptyTitle(props: ComponentProps<"div">) {
  const otherProps = omit(props, "class")
  return (
    <div
      data-slot="empty-title"
      class={cn(
        "cn-font-heading font-medium tracking-tight",
        props.class
      )}
      {...otherProps}
    />
  )
}

function EmptyDescription(props: ComponentProps<"p">) {
  const otherProps = omit(props, "class")
  return (
    <div
      data-slot="empty-description"
      class={cn(
        "text-base/relaxed text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        props.class
      )}
      {...otherProps}
    />
  )
}

function EmptyContent(props: ComponentProps<"div">) {
  const otherProps = omit(props, "class")
  return (
    <div
      data-slot="empty-content"
      class={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-2.5 text-balance",
        props.class
      )}
      {...otherProps}
    />
  )
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
}
