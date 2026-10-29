import DashboardHeader from "@/components/dashboard-header";
import { requireUser } from "@/data/users";
import { RouteProps } from "@solidjs/router";
import { defineFileRoute } from "@solidjs/router/fs";
import { createMemo } from "solid-js";
import { UserProvider } from "@/context/user";

export const route = defineFileRoute("", {
  preload({ location }) {
    return requireUser(location.pathname + location.search);
  }
})

export default function Dashboard(props: RouteProps<typeof route>) {
  const user = createMemo(() => props.data)
  return (
    <UserProvider user={user()}>
      <div>
        <DashboardHeader user={user()} />
        <main class="grid">
          {props.children}
        </main>
      </div>
    </UserProvider>
  )
}
