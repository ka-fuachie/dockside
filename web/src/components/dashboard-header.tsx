import { paths } from "@/router";
import Logo from "./logo";
import { User } from "@/data/users";
import { Button } from "@/components/ui/button";
import { LogOutIcon } from "@lucide/solid";
import { logout } from "@/data/auth";
import { ComponentProps } from "@solidjs/web";
import { cn } from "cn";
import { omit, Show } from "solid-js";

function NavLink(props: ComponentProps<"a">) {
  const otherProps = omit(props, "class", "children")
  return (
    <a class={cn("group relative isolate h-full px-2 hover:bg-muted grid items-center", props.class)} {...otherProps}>
      {props.children}
      <span class="absolute inset-0 -z-1 border-0 border-b-2 border-transparent group-data-active:border-primary" />
    </a>
  )
}

export default function DashboardHeader(props: { user: User }) {
  const isAdmin = () => props.user.role === "ADMIN"
  return (
    <header
      class={[
        "[--padding-inline:calc(4*var(--spacing))] [--padding-block:calc(3*var(--spacing))]",
        "sm:[--padding-inline:calc(6*var(--spacing))] sm:[--padding-block:calc(4*var(--spacing))]",
        "sticky-0 grid grid-cols-[auto_1fr_auto] gap-4 sm:gap-8 border-b border-border"
      ]}
    >
      <div class="flex items-center gap-2 ps-(--padding-inline) py-(--padding-block)">
        <Logo class="text-4xl" />
        <p class="text-2xl sr-only sm:not-sr-only">dockside</p>
      </div>

      <div>
        <nav class="w-fit h-full">
          <ul class="h-full flex gap-0 sm:gap-3">
            <li><NavLink href={paths.sites()}><span>Sites</span></NavLink></li>
            <Show when={isAdmin()}>
              <li><NavLink href={paths.users()}><span>Users</span></NavLink></li>
            </Show>
          </ul>
        </nav>
      </div>

      <div class="flex items-center gap-2 sm:gap-4 pe-(--padding-inline) py-(--padding-block)">
        <div>
          <p
            title={`${props.user.username} [${props.user.role}]`}
            class="text-muted-foreground max-w-[10ch] truncate sm:max-w-none"
          >
            <span>{props.user.username} </span>
            <span class="before:content-['['] after:content-[']'] sr-only sm:not-sr-only font-mono text-xs opacity-75">
              {props.user.role}
            </span>
          </p>
        </div>

        <Button
          variant="tonal"
          size="sm"
          onClick={() => {
            logout().catch()
          }}
        >
          <LogOutIcon />
          <span>Log out</span>
        </Button>
      </div>
    </header>
  )
}
