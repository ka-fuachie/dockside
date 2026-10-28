import { defineFileRoute } from "@solidjs/router/fs"
import { getSite, getSiteUrl } from "@/data/sites"
import { action, RouteProps, useSubmissions } from "@solidjs/router"
import { createMemo, createOptimistic, Errored, flush, For, Match, Switch } from "solid-js"
import { Loading } from "solid-js"
import { Title } from "@solidjs/meta"
import { paths } from "@/router"
import { PageBackLink, PageBody, PageContent, PageDescription, PageHeader, PageHeaderActions, PageSection, PageSectionTitle, PageTitle } from "@/components/page"
import { Button, buttonVariants } from "@/components/ui/button"
import { ExternalLinkIcon } from "@lucide/solid"
import { cn } from "cn"
import { DeploymentStatus, SiteStatusBadge } from "@/components/site-badges"
import { formatAbsoluteDate, formatSmartDate } from "@/lib/date"
import { deploy, listDeployments } from "@/data/deployments"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeploymentUpload } from "@/components/deployment-upload"
import { useSubmissionsError } from "@/lib/form"
import { Dialog, DialogBody, DialogHeader, DialogModal, DialogTrigger } from "@/components/ui/dialog"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const deployAction = action(deploy)

function DeploymentUploadForm(props: { siteId: number }) {
  let formRef: HTMLFormElement | null = null
  const submissions = useSubmissions(deployAction, input => input[0] === props.siteId)
  const { errorMessage, issues, clearErrors } = useSubmissionsError(submissions)
  const [isSubmitting, setIsubmitting] = createOptimistic(false)

  deployAction.onSubmit((_, form) => {
    console.log([...form.entries()])
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

export const route = defineFileRoute("/sites/:slug", {
  preload({ params }) {
    getSite(params.slug)
  }
})

export default function SiteDetail(props: RouteProps<typeof route>) {
  const site = createMemo(() => getSite(props.params.slug));
  const deployments = createMemo(() => listDeployments(site().id))
  const siteUrl = createMemo(() => getSiteUrl(props.params.slug))

  return (
    <>
      <Title>{site().name} - Dockside</Title>

      <PageBody>
        <Errored
          fallback={(err, reset) => (
            <>
              <p>Error loading site</p>
              <p>{(err() as Error)?.message}</p>
              <button type="button" onClick={reset}>Retry</button>
            </>
          )}
        >
          <Loading
            fallback={
              <>
                <PageHeader>
                  <PageBackLink href={paths.sites()}>Sites</PageBackLink>
                </PageHeader>
                <p>Loading site...</p>
              </>
            }
          >
            <PageHeader>
              <div class="grid justify-items-start gap-1">
                <PageBackLink href={paths.sites()}>Sites</PageBackLink>
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
                    <For each={deployments().content} keyed={item => item.id}>
                      {(item) => (
                        <TableRow>
                          <TableCell>v{item().version}</TableCell>
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
                                <Button variant="tonal" size="xs">Rollback</Button>
                              </Match>
                              {/*<Match when={item().status === "failed"}>
                                <Button variant="tonal" size="xs">View logs</Button>
                              </Match>*/}
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
    </>
  )
}
