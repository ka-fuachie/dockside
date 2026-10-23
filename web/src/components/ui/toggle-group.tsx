// "use client"
//
// import { type VariantProps } from "class-variance-authority"
// import { cn } from "cn"
// import { ToggleGroup as ToggleGroupPrimitive } from "@kobalte/core/toggle-group"
//
// import { toggleVariants } from "@/components/ui/toggle"
// import { createContext, createProjection, merge, omit } from "solid-js"
// import { useContext } from "solid-js"
// import { ComponentProps } from "@solidjs/web"
//
// type ToggleGroupContextValue = VariantProps<typeof toggleVariants> & {
//   spacing?: number
//   orientation?: "horizontal" | "vertical"
// }
//
// const ToggleGroupContext = createContext<ToggleGroupContextValue>({
//   size: "default",
//   variant: "default",
//   spacing: 2,
//   orientation: "horizontal",
// })
//
// function ToggleGroup(props: ComponentProps<typeof ToggleGroupPrimitive> &
//   VariantProps<typeof toggleVariants> & {
//     spacing?: number
//     orientation?: "horizontal" | "vertical"
//   }) {
//   const mergedProps = merge({ orientation: "horizontal" as "horizontal" | "vertical" }, props)
//   const otherProps = omit(mergedProps, "class", "children", "variant", "size", "spacing", "orientation")
//   const context = createProjection((draft) => {
//     draft.variant = mergedProps.variant
//     draft.size = mergedProps.size
//     draft.spacing = mergedProps.spacing
//     draft.orientation = mergedProps.orientation
//   }, {} as ToggleGroupContextValue)
//
//   return (
//     <ToggleGroupPrimitive
//       data-slot="toggle-group"
//       data-variant={mergedProps.variant}
//       data-size={mergedProps.size}
//       data-spacing={mergedProps.spacing}
//       data-orientation={mergedProps.orientation}
//       style={{ "--gap": mergedProps.spacing }}
//       class={cn(
//         "group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] rounded-lg data-[size=sm]:rounded-[min(var(--radius-md),10px)] data-vertical:flex-col data-vertical:items-stretch",
//         mergedProps.class
//       )}
//       {...otherProps}
//     >
//       <ToggleGroupContext value={context}>
//         {mergedProps.children}
//       </ToggleGroupContext>
//     </ToggleGroupPrimitive>
//   )
// }
//
// function ToggleGroupItem(props: ComponentProps<typeof ToggleGroupPrimitive.Item> &
//   VariantProps<typeof toggleVariants>) {
//   const mergedProps = merge({ variant: "default", size: "default" } as VariantProps<typeof toggleVariants>, props)
//   const otherProps = omit(mergedProps, "class", "children", "variant", "size")
//   const context = useContext(ToggleGroupContext)
//
//   return (
//     <ToggleGroupPrimitive.Item
//       data-slot="toggle-group-item"
//       data-variant={context.variant || mergedProps.variant}
//       data-size={context.size || mergedProps.size}
//       data-spacing={context.spacing}
//       class={cn(
//         "shrink-0 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-2 focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pr-1.5 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:pl-1.5 group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-lg group-data-vertical/toggle-group:data-[spacing=0]:first:rounded-t-lg group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-lg group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-lg group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:border-l-0 group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0 group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-l group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t",
//         toggleVariants({
//           variant: context.variant || mergedProps.variant,
//           size: context.size || mergedProps.size,
//         }),
//         mergedProps.class
//       )}
//       {...otherProps}
//     >
//       {mergedProps.children}
//     </ToggleGroupPrimitive.Item>
//   )
// }
//
// export { ToggleGroup, ToggleGroupItem }
