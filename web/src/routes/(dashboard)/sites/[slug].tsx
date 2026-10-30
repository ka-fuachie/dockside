import { defineFileRoute } from "@solidjs/router/fs"
import { liveSite, getSiteUrl } from "@/data/sites"
import { action, RouteProps, useAction, useLocation, useSubmissions } from "@solidjs/router"
import { createMemo, createOptimistic, createSignal, Errored, flush, For, Match, Show, Switch } from "solid-js"
import { Loading } from "solid-js"
import { Title } from "@solidjs/meta"
import { paths } from "@/router"
import { PageBackLink, PageBody, PageContent, PageDescription, PageHeader, PageHeaderActions, PageSection, PageSectionTitle, PageTitle } from "@/components/page"
import { Button, buttonVariants } from "@/components/ui/button"
import { AlertCircleIcon, ExternalLinkIcon, RocketIcon } from "@lucide/solid"
import { cn } from "cn"
import { DeploymentStatus, SiteStatusBadge, StatusStyles } from "@/components/site-badges"
import { formatAbsoluteDate, formatSmartDate } from "@/lib/date"
import { deploy, liveDeployments, rollback } from "@/data/deployments"
import { getIncidents } from "@/data/incidents"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeploymentUpload } from "@/components/deployment-upload"
import { useSubmissionsError } from "@/lib/form"
import { Dialog, DialogBody, DialogHeader, DialogModal, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Repeat } from "solid-js"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const deployAction = action(deploy)
const rollbackAction = action(rollback)

function RollbackButton(props: { id: number }) {
  const rollbackTo = useAction(rollbackAction)
  const submissions = useSubmissions(rollbackAction, (input) => input[0] === props.id)
  return (
    <Button
      variant="tonal"
      size="xs"
      class="-my-4"
      disabled={submissions.length > 0}
      onClick={() => rollbackTo(props.id).catch(() => {})}
    >Rollback</Button>
  )
}

function RollbackErrors() {
  const submissions = useSubmissions(rollbackAction)
  const { errorMessage } = useSubmissionsError(submissions)
  return (
    <div aria-live="polite" class="empty:hidden">
      <Show when={errorMessage()}>
        {(message) => <p class="text-destructive text-sm">{message()}</p>}
      </Show>
    </div>
  )
}

function DeploymentIncidents(props: { deploymentId: number }) {
  const incidents = createMemo(() => getIncidents(props.deploymentId))

  return (
    <Dialog>
      <DialogTrigger variant="tonal" size="xs" class="-my-4">View logs</DialogTrigger>

      <DialogModal
        class="[--dialog-body-max-width:56rem]"
      >
        <DialogBody>
          <DialogHeader>
            <h2 class="text-xl text-left">Deployment #{props.deploymentId} incidents</h2>
          </DialogHeader>

          <Errored fallback={(err, reset) => (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><AlertCircleIcon /></EmptyMedia>
                <EmptyTitle>Failed to load incidents</EmptyTitle>
                <EmptyDescription>{(err() as Error)?.message ?? "Something went wrong"}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button size="sm" variant="tonal" onClick={reset}>Try again</Button>
              </EmptyContent>
            </Empty>
          )}>
            <Loading fallback={<Skeleton class="h-6 w-48" />}>
              <Show
                when={incidents().length > 0}
                fallback={<p class="text-muted-foreground text-left">No incidents were recorded for this deployment.</p>}
              >
                <div class="grid gap-6 max-h-[60vh] overflow-y-auto">
                  <For each={incidents()} keyed={incident => incident.id}>
                    {(incident) => (
                      <div class="grid gap-2">
                        <div class="flex items-baseline justify-between gap-4">
                          <p class="text-left">{incident().reason}</p>
                          <time datetime={incident().createdAt} class="text-muted-foreground text-xs">{formatAbsoluteDate(incident().createdAt)}</time>
                        </div>
                        <pre class="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-auto text-left whitespace-pre-wrap wrap-break-word">
                          {incident().logs ?? "No logs were captured for this incident."}
                        </pre>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </Loading>
          </Errored>
        </DialogBody>
      </DialogModal>
    </Dialog>
  )
}

function DeploymentUploadForm(props: { siteId: number }) {
  let formRef: HTMLFormElement | null = null
  const submissions = useSubmissions(deployAction, input => input[0] === props.siteId)
  const { errorMessage, issues, clearErrors } = useSubmissionsError(submissions)
  const [isSubmitting, setIsubmitting] = createOptimistic(false)

  deployAction.onSubmit(() => {
    setIsubmitting(true)
  })

  return (
    <form
      method="post"
      action={deployAction.with(props.siteId)}
      enctype="multipart/form-data"
      ref={node => formRef = node}
    >
      <DeploymentUpload
        errorMessage={errorMessage()}
        issues={issues()}
        isSubmitting={isSubmitting()}
        onChange={() => {
          if(formRef == null) return
          clearErrors()
          flush()
          formRef.requestSubmit()
        }}
      />
    </form>
  )
}

function SiteHeaderSkeleton() {
  return (
    <PageHeader>
      <div class="grid justify-items-start gap-1">
        <Skeleton class="h-4 w-16" />
        <div class="flex items-center gap-2">
          <Skeleton class="h-10 w-40 sm:w-64" />
          <Skeleton class="h-6 w-14 rounded-full" />
        </div>
        <div class="flex items-center gap-2">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-4 w-32 hidden sm:block" />
        </div>
      </div>
      <PageHeaderActions>
        <Skeleton class="h-8 w-24 rounded-full" />
      </PageHeaderActions>
    </PageHeader>
  )
}

function DeploymentsTableSkeleton(props: { num: number }) {
  return (
    <Table>
      <TableCaption class="sr-only">Loading deployments</TableCaption>
      <TableHeader>
        <TableRow header>
          <TableHead>Version</TableHead>
          <TableHead>Result</TableHead>
          <TableHead>Deployed At</TableHead>
          <TableHead>Deployed By</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <Repeat count={props.num}>
          {() => (
            <TableRow class="hover:bg-transparent!">
              <TableCell>
                <Skeleton class="h-4 w-10" />
              </TableCell>
              <TableCell>
                <Skeleton class="h-6 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton class="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton class="h-4 w-24" />
              </TableCell>
              <TableCell class="w-fit">
                <Skeleton class="h-6 w-16 rounded-full" />
              </TableCell>
            </TableRow>
          )}
        </Repeat>
      </TableBody>
    </Table>
  )
}

function NoDeploymentsFallback() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RocketIcon />
        </EmptyMedia>
        <EmptyTitle>No deployments yet</EmptyTitle>
        <EmptyDescription>
          Upload your first build using the form below to deploy this site.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export const route = defineFileRoute("/sites/:slug", {
  preload({ params }) {
    liveSite(params.slug)
  }
})

export default function SiteDetail(props: RouteProps<typeof route>) {
  const location = useLocation();
  const site = createMemo(() => liveSite(props.params.slug));
  const deployments = createMemo(() => liveDeployments(site().id))
  const siteUrl = createMemo(() => getSiteUrl(props.params.slug))

  return (
    <PageBody>
      <Errored
        fallback={(err, reset) => (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircleIcon />
              </EmptyMedia>
              <EmptyTitle>Failed to load site</EmptyTitle>
              <EmptyDescription>
                {(err() as Error)?.message ?? "Something went wrong"}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" variant="tonal" onClick={reset}>
                Try again
              </Button>
            </EmptyContent>
          </Empty>

        )}
      >
        <Loading
          fallback={
            <>
              <SiteHeaderSkeleton />
              <PageContent>
                <PageSection>
                  <PageSectionTitle>Deployments</PageSectionTitle>
                  <DeploymentsTableSkeleton num={3} />
                </PageSection>
                <PageSection>
                  <PageSectionTitle class="sr-only">New deployment</PageSectionTitle>
                  <Skeleton class="h-40 w-full rounded-lg" />
                </PageSection>
              </PageContent>
            </>
          }
        >
          <Title>{site().name} - Dockside</Title>

          <PageHeader>
            <div class="grid justify-items-start gap-1">
              <PageBackLink
                href={(location.state as { previous?: string } | null)?.previous ?? paths.sites()}
              >Sites</PageBackLink>
              <div class="flex items-center gap-2">
                <PageTitle class="text-3xl sm:text-4xl">{site().name}</PageTitle>
                <SiteStatusBadge status={site().currentVersion == null ? null: site().up ? "up" : "down"} />
              </div>
              <PageDescription class="flex items-center gap-2 text-sm sm:text-base">
                <span class="sr-only sm:not-sr-only">/{site().slug}</span>
                <span class="text-muted-foreground/75">Created <time datetime={site().createdAt}>{formatSmartDate(site().createdAt)}</time></span>
              </PageDescription>
            </div>

            <PageHeaderActions>
              <Loading>
                <a href={siteUrl()} target="_blank" class={cn(buttonVariants({ size: "sm" }))}>
                  <ExternalLinkIcon />
                  <span>Visit site</span>
                </a>
              </Loading>
            </PageHeaderActions>
          </PageHeader>

          <PageContent>
            {/* TODO: Monitoring charts */}
            {/*<PageSection>
              <PageSectionTitle class="sr-only">Monitoring</PageSectionTitle>
              <div class="grid grid-cols-2 gap-6 text-left">
                <Card>
                  <CardHeader>
                    <CardTitle>Latency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      <span class="text-3xl">84</span>
                      <span class="text-sm text-muted-foreground"> ms average</span>
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Availability</CardTitle>
                  </CardHeader>
                  <CardContent></CardContent>
                </Card>
              </div>
            </PageSection>*/}

            <PageSection>
              <PageSectionTitle>Deployments</PageSectionTitle>

              <RollbackErrors />

              <Table>
                <TableCaption class="sr-only">Deployments list</TableCaption>
                <TableHeader>
                  <TableRow header>
                    <TableHead>Version</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Deployed At</TableHead>
                    <TableHead>Deployed By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <For
                    each={deployments().content}
                    keyed={item => item.id}
                    fallback={
                      <TableRow class="hover:bg-transparent!">
                        <TableCell colspan={5}>
                          <NoDeploymentsFallback />
                        </TableCell>
                      </TableRow>
                    }
                  >
                    {(item) => (
                      <TableRow>
                        <TableCell>
                          <p class="flex items-center gap-1">
                            <span>v{item().version}</span>
                            {item().version === site().currentVersion && (
                              <Badge class={cn(StatusStyles.green, "text-xs")}>Current</Badge>
                            )}
                          </p>
                        </TableCell>
                        <TableCell>
                          <DeploymentStatus status={item().status} />
                        </TableCell>
                        <TableCell>
                          <time datetime={item().createdAt} class="text-muted-foreground">{formatAbsoluteDate(item().createdAt)}</time>
                        </TableCell>
                        <TableCell>{item().createdByUsername ?? "-"}</TableCell>
                        <TableCell class="w-fit">
                          <Switch>
                            <Match when={ item().status === "success" && site().currentVersion !== item().version}>
                              <RollbackButton id={item().id} />
                            </Match>
                            <Match when={item().status === "failed"}>
                              <DeploymentIncidents deploymentId={item().id} />
                            </Match>
                          </Switch>
                        </TableCell>
                      </TableRow>
                    )}
                  </For>
                </TableBody>
              </Table>
            </PageSection>

            <PageSection>
              <PageSectionTitle class="sr-only">New deployment</PageSectionTitle>
              <DeploymentUploadForm siteId={site().id} />
            </PageSection>
          </PageContent>
        </Loading>
      </Errored>
    </PageBody>
  )
}
