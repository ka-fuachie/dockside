import { defineFileRoute } from "@solidjs/router/fs"
import { redirect } from "@solidjs/web"

export const route = defineFileRoute("/", {
  preload() {
    return redirect("/sites")
  }
})

export default function Home() {
  return null
}
