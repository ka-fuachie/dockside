// "use client"
//
// import { cva, type VariantProps } from "class-variance-authority"
// import { cn } from "cn"
// import { ToggleButton as TogglePrimitive } from "@kobalte/core/toggle-button"
// import { merge } from "solid-js"
// import { omit } from "solid-js"
// import { ComponentProps } from "@solidjs/web"
//
// const toggleVariants = cva(
//   "group/toggle inline-flex items-center justify-center gap-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all outline-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-pressed:bg-muted data-[state=on]:bg-muted dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
//   {
//     variants: {
//       variant: {
//         default: "bg-transparent",
//         outline: "border border-input bg-transparent hover:bg-muted",
//       },
//       size: {
//         default:
//           "h-8 min-w-8 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
//         sm: "h-7 min-w-7 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
//         lg: "h-9 min-w-9 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//       size: "default",
//     },
//   }
// )
//
// function Toggle(props: ComponentProps<typeof TogglePrimitive> &
//   VariantProps<typeof toggleVariants>) {
//   const mergedProps = merge({ variant: "default", size: "default" } as VariantProps<typeof toggleVariants>, props)
//   const otherProps = omit(props, "class", "variant", "size")
//
//   return (
//     <TogglePrimitive
//       data-slot="toggle"
//       class={cn(toggleVariants({ variant: mergedProps.variant, size: mergedProps.size, class: mergedProps.class }))}
//       {...otherProps}
//     />
//   )
// }
//
// export { Toggle, toggleVariants }
