"use client"

import { createScrollIndicators } from "@/hooks/scroll-indicators"
import { ComponentProps } from "@solidjs/web"
import { cn } from "cn"
import { omit } from "solid-js"

function Table(props: ComponentProps<"table">) {
  const otherProps = omit(props, "class")
  let tableWrapperRef: HTMLDivElement | null = null
  const { canScrollLeft, canScrollRight, handleScroll } = createScrollIndicators(() => tableWrapperRef)

  return (
    <div
      data-slot="table-container"
      onScroll={handleScroll}
      class={[
        "relative w-full overflow-x-auto overscroll-x-none rounded-lg border border-border",
        "[--edge-fade-size:1.5rem]",
        canScrollLeft() && canScrollRight() && (
          "mask-[linear-gradient(to_right,transparent,black_var(--edge-fade-size),black_calc(100%-var(--edge-fade-size)),transparent)]"
        ),
        !canScrollLeft() && canScrollRight() && (
          "mask-[linear-gradient(to_right,black,black_calc(100%-var(--edge-fade-size)),transparent)]"
        ),
        canScrollLeft() && !canScrollRight() && (
          "mask-[linear-gradient(to_right,transparent,black_var(--edge-fade-size),black)]"
        ),
      ]}
      ref={node => tableWrapperRef = node}
    >
      <table
        data-slot="table"
        class={cn("w-full caption-bottom text-sm", props.class)}
        {...otherProps}
      />
    </div>
  )
}

function TableHeader(props: ComponentProps<"thead">) {
  const otherProps = omit(props, "class")

  return (
    <thead
      data-slot="table-header"
      class={cn("[&_tr]:border-b", props.class)}
      {...otherProps}
    />
  )
}

function TableBody(props: ComponentProps<"tbody">) {
  const otherProps = omit(props, "class")

  return (
    <tbody
      data-slot="table-body"
      class={cn("[&_tr:last-child]:border-0", props.class)}
      {...otherProps}
    />
  )
}

function TableFooter(props: ComponentProps<"tfoot">) {
  const otherProps = omit(props, "class")

  return (
    <tfoot
      data-slot="table-footer"
      class={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        props.class
      )}
      {...otherProps}
    />
  )
}

function TableRow(props: ComponentProps<"tr"> & {header?: boolean}) {
  const otherProps = omit(props, "class")
  const header = () => !!props.header

  return (
    <tr
      data-slot="table-row"
      class={cn(
        "border-b transition-colors [thead_>_*]:bg-muted/90 [:not(thead_>_*)&]:hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        header() && "[&>th:first-child]:rounded-tl-lg [&>th:last-child]:rounded-tr-lg",
        !header() && "relative isolate last-of-type:[&>td:first-child]:rounded-bl-lg last-of-type:[&>td:last-child]:rounded-br-lg",
        props.class
      )}
      {...otherProps}
    />
  )
}

function TableHead(props: ComponentProps<"th">) {
  const otherProps = omit(props, "class")

  return (
    <th
      data-slot="table-head"
      class={cn(
        "h-10 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground has-[[role=checkbox]]:pr-0",
        props.class
      )}
      {...otherProps}
    />
  )
}

function TableCell(props: ComponentProps<"td">) {
  const otherProps = omit(props, "class")

  return (
    <td
      data-slot="table-cell"
      class={cn(
        "p-3 align-middle text-left whitespace-nowrap has-[[role=checkbox]]:pr-0",
        props.class
      )}
      {...otherProps}
    />
  )
}

function TableCaption(props: ComponentProps<"caption">) {
  const otherProps = omit(props, "class")

  return (
    <caption
      data-slot="table-caption"
      class={cn("mt-4 text-sm text-muted-foreground", props.class)}
      {...otherProps}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
