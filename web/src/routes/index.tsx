import { RouteProps } from "@solidjs/router"
import { defineFileRoute } from "@solidjs/router/fs"
import { redirect } from "@solidjs/web"
import { createMemo, Show } from "solid-js"

export const route = defineFileRoute("/", {
  preload() {
    throw redirect("/sites")
  }
})

export default function Home(props: RouteProps<typeof route>) {
  const trigger = createMemo(() => props.data)
  return <Show when={trigger()}>{<></>}</Show>
}
