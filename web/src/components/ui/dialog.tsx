"use client"

import { cn } from "cn"
import { XIcon } from "@lucide/solid"
import { Dialog as DialogPrimitive } from "@kobalte/core/dialog"

import { Button } from "@/components/ui/button"
import { ComponentProps } from "@solidjs/web"
import { merge, omit } from "solid-js"

function Dialog(props: ComponentProps<typeof DialogPrimitive>) {
  return <DialogPrimitive data-slot="dialog" {...props} />
}

function DialogTrigger(props: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal(props: ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose(props: ComponentProps<typeof DialogPrimitive.CloseButton>) {
  return <DialogPrimitive.CloseButton data-slot="dialog-close" {...props} />
}

function DialogOverlay(props: ComponentProps<typeof DialogPrimitive.Overlay>) {
  const otherProps = omit(props, "class")
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      class={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        props.class
      )}
      {...otherProps}
    />
  )
}

function DialogContent(props: ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  }) {
  const mergedProps = merge({ showCloseButton: true }, props)
  const otherProps = omit(mergedProps, "class", "children", "showCloseButton")

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        class={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          mergedProps.class
        )}
        {...otherProps}
      >
        {mergedProps.children}
        {mergedProps.showCloseButton && (
          <DialogPrimitive.CloseButton
            as={Button}
            data-slot="dialog-close"
            variant="ghost"
            class="absolute top-2 right-2"
            size="icon-sm"
          >
            <XIcon />
            <span class="sr-only">Close</span>
          </DialogPrimitive.CloseButton>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader(props: ComponentProps<"div">) {
  const otherProps = omit(props, "class")
  return (
    <div
      data-slot="dialog-header"
      class={cn("flex flex-col gap-2", props.class)}
      {...otherProps}
    />
  )
}

function DialogFooter(props: ComponentProps<"div"> & {showCloseButton?: boolean}) {
  const mergedProps = merge({ showCloseButton: true }, props)
  const otherProps = omit(mergedProps, "class", "children", "showCloseButton")

  return (
    <div
      data-slot="dialog-footer"
      class={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        mergedProps.class
      )}
      {...otherProps}
    >
      {mergedProps.children}
      {mergedProps.showCloseButton && (
        <DialogPrimitive.CloseButton as={Button} variant="outline">
          Close
        </DialogPrimitive.CloseButton>
      )}
    </div>
  )
}

function DialogTitle(props: ComponentProps<typeof DialogPrimitive.Title>) {
  const otherProps = omit(props, "class")
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      class={cn(
        "cn-font-heading text-base leading-none font-medium",
        props.class
      )}
      {...otherProps}
    />
  )
}

function DialogDescription(props: ComponentProps<typeof DialogPrimitive.Description>) {
  const otherProps = omit(props, "class")
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      class={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        props.class
      )}
      {...otherProps}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
