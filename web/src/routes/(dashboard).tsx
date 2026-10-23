import DashboardHeader from "@/components/dashboard-header";
import { requireUser } from "@/data/user";
import { RouteProps } from "@solidjs/router";
import { defineFileRoute } from "@solidjs/router/fs";
import { createMemo } from "solid-js";

export const route = defineFileRoute("", {
  preload({ location }) {
    return requireUser(location.pathname + location.search);
  }
})

export default function Dashboard(props: RouteProps<typeof route>) {
  const user = createMemo(() => props.data)
  return (
    <div>
      <DashboardHeader user={user()} />
      <main class="grid">
        {props.children}
      </main>
    </div>
  )
}
