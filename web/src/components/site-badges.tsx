import { Badge } from "@/components/ui/badge"
import { DotIcon, LoaderCircleIcon } from "@lucide/solid"
import { Match, Switch } from "solid-js"

const StatusStyles = {
  green: "text-green-600 dark:text-green-500 bg-green-300/25 dark:bg-green-500/25",
  yellow: "text-amber-500 dark:text-amber-500 bg-amber-300/25 dark:bg-amber-500/25",
  red: "text-red-600 dark:text-red-500 bg-red-300/25 dark:bg-red-700/20",
  gray: "text-muted-foreground/75 bg-muted/90"
}

const SiteStatusBadgeStyles = {
  up: StatusStyles.green,
  down: StatusStyles.red,
  default: StatusStyles.gray,
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
  running: StatusStyles.yellow,
  success: StatusStyles.green,
  failed: StatusStyles.red,
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
