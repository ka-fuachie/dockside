import { paths } from "@/router";
import Logo from "./logo";
import { User } from "@/data/user";
import { Button } from "@/components/ui/button";
import { LogOutIcon } from "@lucide/solid";
import { logout } from "@/data/auth";
import { toast } from "@/lib/solid-sonner";
import { ComponentProps } from "@solidjs/web";
import { cn } from "cn";
import { omit } from "solid-js";

function NavLink(props: ComponentProps<"a">) {
  const otherProps = omit(props, "class")
  return <a class={cn("h-full px-2 border-0 border-b-2 border-transparent data-active:border-primary hover:bg-muted grid items-center", props.class)} {...otherProps} />
}

export default function DashboardHeader(props: { user: User }) {
  return (
    <header
      class="grid grid-cols-[auto_1fr_auto] gap-8 border-b border-border"
      style={{
        "--padding-inline": "calc(6 * var(--spacing))",
        "--padding-block": "calc(3 * var(--spacing))"
      }}
    >
      <div class="flex items-center gap-2 ps-(--padding-inline) py-(--padding-block)">
        <Logo class="text-4xl" />
        <p class="text-2xl">dockside</p>
      </div>

      <div>
        <nav class="w-fit h-full">
          <ul class="h-full flex gap-3">
            <li><NavLink href={paths.sites()}><span>Sites</span></NavLink></li>
            <li><NavLink href={""}><span>Users</span></NavLink></li>
            {/*<li><a href={paths.users()}>Users</a></li>*/}
          </ul>
        </nav>
      </div>

      <div class="flex items-center gap-4 pe-(--padding-inline) py-(--padding-block)">
        <div>
          <p class="">{props.user.username}</p>
          <p class="font-mono text-xs opacity-60">{props.user.role}</p>
        </div>

        <Button
          variant="secondary"
          onClick={() => {
            logout().catch(err => toast.error((err as Error).message))
          }}
        >
          <LogOutIcon />
          <span>Log out</span>
        </Button>
      </div>
    </header>
  )
}
