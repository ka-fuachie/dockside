import { Badge } from "@/components/ui/badge"
import { DotIcon, LoaderCircleIcon } from "@lucide/solid"
import { Match, Switch } from "solid-js"

const SiteStatusBadgeStyles = {
  up: "text-green-500 bg-green-500/25",
  down: "text-red-500 bg-red-200/25",
  default: "text-muted-foreground bg-muted/50",
}

const SiteStatusBadgeText = {
  up: "Up",
  down: "Down",
  default: "Unavailable",
}

export function SiteStatusBadge(props: { status?: "up" | "down" | null }) {
  return (
    <Badge class={SiteStatusBadgeStyles[props.status ?? "default"]}>
      <DotIcon class="size-6! -m-2" />
      <span>{SiteStatusBadgeText[props.status ?? "default"]}</span>
    </Badge>
  )
}

const DeploymentStatusBadgeStyle = {
  running: "text-amber-500 bg-amber-500/25",
  success: "text-green-500 bg-green-500/25",
  failed: "text-red-500 bg-red-200/25",
}

const DeploymentStatusBadgeText = {
  running: "Running",
  success: "Success",
  failed: "Failed"
}

export function DeploymentStatus(props: { status: "running" | "success" | "failed" }) {
  return (
    <Badge class={DeploymentStatusBadgeStyle[props.status]}>
      <Switch fallback={<DotIcon class="size-6! -m-2" />}>
        <Match when={props.status === "running"}>
          <LoaderCircleIcon class="animate-spin" />
        </Match>
      </Switch>

      <span>{DeploymentStatusBadgeText[props.status]}</span>
    </Badge>
  )
}
