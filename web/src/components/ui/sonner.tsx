"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "@lucide/solid"
// import { useTheme } from "next-themes"
import { Toaster as Sonner } from "@/lib/solid-sonner"

type ToasterProps = Parameters<typeof Sonner>[0];

const Toaster = (props: ToasterProps) => {
  // const { theme = "system" } = useTheme()

  return (
    <Sonner
      // theme={theme as ToasterProps["theme"]}
      class="toaster group"
      icons={{
        success: <CircleCheckIcon class="size-4" />,
        info: <InfoIcon class="size-4" />,
        warning: <TriangleAlertIcon class="size-4" />,
        error: <OctagonXIcon class="size-4" />,
        loading: <Loader2Icon class="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        }
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
