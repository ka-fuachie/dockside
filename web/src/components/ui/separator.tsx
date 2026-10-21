"use client"

import { Separator as SeparatorPrimitive, SeparatorRootProps } from "@kobalte/core/separator"
import { cn } from "cn"
import { merge, omit } from "solid-js"

function Separator(props: SeparatorRootProps) {
  const mergedProps = merge({ orientation: "horizontal" as SeparatorRootProps["orientation"] }, props)
  const otherProps = omit(props, "class", "orientation")

  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={mergedProps.orientation}
      class={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        mergedProps.class
      )}
      {...otherProps}
    />
  )
}

export { Separator }
