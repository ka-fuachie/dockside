// import { cn } from "cn"
// import { Tooltip as TooltipPrimitive } from "@kobalte/core/tooltip"
// import { ComponentProps } from "@solidjs/web"
// import { merge } from "solid-js"
// import { omit } from "solid-js"
//
// function Tooltip(props: ComponentProps<typeof TooltipPrimitive>) {
//   return <TooltipPrimitive data-slot="tooltip" {...props} />
// }
//
// function TooltipTrigger(props: ComponentProps<typeof TooltipPrimitive.Trigger>) {
//   return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
// }
//
// function TooltipContent(props: ComponentProps<typeof TooltipPrimitive.Content>) {
//   const mergedProps = merge({ sideOffset: 0 }, props)
//   const otherProps = omit(mergedProps, "class", "sideOffset", "children")
//   return (
//     <TooltipPrimitive.Portal>
//       <TooltipPrimitive.Content
//         data-slot="tooltip-content"
//         sideOffset={mergedProps.sideOffset}
//         class={cn(
//           "z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
//           mergedProps.class
//         )}
//         {...otherProps}
//       >
//         {mergedProps.children}
//         <TooltipPrimitive.Arrow class="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
//       </TooltipPrimitive.Content>
//     </TooltipPrimitive.Portal>
//   )
// }
//
// export { Tooltip, TooltipContent, TooltipTrigger }
