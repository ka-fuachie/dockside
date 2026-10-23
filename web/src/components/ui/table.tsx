"use client"

import { ComponentProps } from "@solidjs/web"
import { cn } from "cn"
import { omit } from "solid-js"

function Table(props: ComponentProps<"table">) {
  const otherProps = omit(props, "class")

  return (
    <div
      data-slot="table-container"
      class="relative w-full overflow-x-auto"
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

function TableRow(props: ComponentProps<"tr">) {
  const otherProps = omit(props, "class")

  return (
    <tr
      data-slot="table-row"
      class={cn(
        "border-b transition-colors [thead_>_*]:bg-muted/90 [:not(thead_>_*)&]:hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
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
