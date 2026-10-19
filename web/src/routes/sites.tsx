import { RouteProps } from "@solidjs/router"
import { requireUser } from "../data/user"
import { createMemo, Show } from "solid-js"
import { defineFileRoute } from "@solidjs/router/fs"

export const route = defineFileRoute("/sites", {
  preload({ location }) {
    requireUser(location.pathname + location.search)
  },
})

export default function SitesLayout(props: RouteProps<typeof route>) {
  const user = createMemo(() => requireUser(props.location.pathname + props.location.search))
  return (
    <Show when={user()}>
      <header>
        <p>Dockside</p>
        <div>
          <p>{user().username}</p>
          <p>{user().role}</p>
        </div>
      </header>
      <main>
        {props.children}
      </main>
    </Show>
  )
}
