import { defineFileRoute } from "@solidjs/router/fs"
import { createSite, getSitesList } from "@/data/sites"
import { createMemo, Errored, For, Loading, Show } from "solid-js"
import { JSX } from "@solidjs/web/jsx-runtime"
import { Title } from "@solidjs/meta"
import { action, RouteProps, SearchParams, useLocation, useNavigate, useSearchParams, useSubmissions } from "@solidjs/router"
import { Button } from "@/components/ui/button"
import { AlertCircleIcon, ChevronLeftIcon, ChevronRightIcon, GlobeIcon, LayoutGridIcon, ListSortDescendingIcon, PlusIcon, SearchIcon } from "@lucide/solid"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createSignal, Switch, Match } from "solid-js"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogBody, DialogHeader, DialogModal, DialogTrigger } from "@/components/ui/dialog"
import { slugify } from "@/lib/utils"
import { isInvalid, useSubmissionsError } from "@/lib/form"
import { PageBody, PageContent, PageHeader, PageHeaderActions, PageTitle } from "@/components/page"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatAbsoluteDate, formatSmartDate } from "@/lib/date"
import { paths } from "@/router"
import { DeploymentStatus, SiteStatusBadge } from "@/components/site-badges"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Repeat } from "solid-js"
import { useIsAdmin } from "@/context/user"

const createSiteAction = action(createSite)

function AddSiteAction() {
  const submissions = useSubmissions(createSiteAction)
  const { errorMessage, issues, clearErrors } = useSubmissionsError(submissions)
  const [name, setName] = createSignal("")
  const [slug, setSlug] = createSignal("")
  let formRef: HTMLFormElement | null = null

  return (
    <Dialog>
      <DialogTrigger>
        <PlusIcon />
        <span>Add site</span>
      </DialogTrigger>

      <DialogModal
        onClose={() => {
          clearErrors()
          formRef?.reset()
          setName("")
          setSlug("")
        }}
      >
        <DialogBody>
          <DialogHeader>
            <h2 class="text-xl text-left">New Site</h2>
          </DialogHeader>

          <div aria-live="polite">
            <Show when={errorMessage()}>
              {(message) => <p class="text-destructive text-left">{message()}</p>}
            </Show>
          </div>

          <form
            method="post"
            action={createSiteAction}
            ref={node => formRef = node}
          >
            <FieldGroup>
              <Field data-invalid={String(isInvalid(issues(), "name"))}>
                <FieldLabel for="name">Name</FieldLabel>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  onInput={ev => setName(ev.currentTarget.value)}
                  aria-invalid={isInvalid(issues(), "name") ? "true": "false"}
                />
                {isInvalid(issues(), "name") && <FieldError>{issues()!.name}</FieldError>}
              </Field>

              <Field data-invalid={String(isInvalid(issues(), "slug"))}>
                <FieldLabel for="slug" class="gap-1">Slug<span class="text-muted-foreground/75 text-xs" aria-hidden="true">(optional)</span></FieldLabel>
                <Input
                  type="text"
                  id="slug"
                  name="slug"
                  onInput={ev => setSlug(ev.currentTarget.value)}
                  aria-invalid={isInvalid(issues(), "slug") ? "true": "false"}
                />
                <Show when={name().trim() != "" && slug().trim() == ""}>
                  <FieldDescription class="text-sm">Auto generated as {slugify(name().trim())}</FieldDescription>
                </Show>
                {isInvalid(issues(), "slug") && <FieldError>{issues()!.slug}</FieldError>}
              </Field>

              <Field class="items-end">
                <Button type="submit" class="w-fit!">Add Site</Button>
              </Field>
            </FieldGroup>
          </form>
        </DialogBody>
      </DialogModal>
    </Dialog>
  )
}

function SitesTableSkeleton(props: { num: number }) {
  return (
    <Table>
      <TableCaption class="sr-only">Loading sites</TableCaption>
      <TableHeader>
        <TableRow header>
          <TableHead>Name/Slug</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Latest</TableHead>
          <TableHead>Current</TableHead>
          <TableHead>Status</TableHead>
          <TableHead><span class="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <Repeat count={props.num}>
          {() => (
            <TableRow class="hover:bg-transparent!">
              <TableCell>
                <div class="flex items-center gap-2">
                  <Skeleton class="size-4 rounded-full" />
                  <div class="grid gap-1">
                    <Skeleton class="h-4 w-28" />
                    <Skeleton class="h-3 w-16" />
                  </div>
                </div>
              </TableCell>
              <TableCell><Skeleton class="h-4 w-20" /></TableCell>
              <TableCell>
                <div class="grid gap-1">
                  <div class="flex items-center gap-1">
                    <Skeleton class="h-4 w-8" />
                    <Skeleton class="size-2 rounded-full" />
                  </div>
                  <Skeleton class="h-3 w-24" />
                </div>
              </TableCell>
              <TableCell><Skeleton class="h-4 w-10" /></TableCell>
              <TableCell><Skeleton class="h-6 w-14 rounded-full" /></TableCell>
              <TableCell><Skeleton class="size-5" /></TableCell>
            </TableRow>
          )}
        </Repeat>
      </TableBody>
    </Table>
  )
}

function SitesGridSkeleton(props: { num: number }) {
  return (
    <div class="grid grid-cols-[repeat(auto-fit,minmax(17.5rem,1fr))] gap-4">
      <Repeat count={props.num}>
        {() => (
          <Card class="relative">
            <CardHeader class="relative">
              <Skeleton class="size-5" />
              <Skeleton class="h-5 w-32" />
              <Skeleton class="h-4 w-20" />
            </CardHeader>
            <CardContent class="grid gap-2">
              <div class="flex items-center justify-between">
                <Skeleton class="h-4 w-16" />
                <Skeleton class="h-4 w-20" />
              </div>
              <div class="flex items-center justify-between">
                <Skeleton class="h-4 w-24" />
                <div class="flex items-center gap-2">
                  <Skeleton class="h-4 w-8" />
                  <Skeleton class="size-2 rounded-full" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div class="flex items-center justify-between w-full">
                <Skeleton class="h-4 w-20" />
                <Skeleton class="size-5" />
              </div>
            </CardFooter>
          </Card>
        )}
      </Repeat>
    </div>
  )
}

function NoSitesFallback(props: { filtersEngaged: boolean; isAdmin: boolean }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon"><GlobeIcon /></EmptyMedia>
        <Show
          when={props.filtersEngaged}
          fallback={
            <Show
              when={props.isAdmin}
              fallback={
                <>
                  <EmptyTitle>No sites yet</EmptyTitle>
                  <EmptyDescription>Ask an admin to add your first site.</EmptyDescription>
                </>
              }
            >
              <EmptyTitle>No sites yet</EmptyTitle>
              <EmptyDescription>Create your first site to get started.</EmptyDescription>
            </Show>
          }
        >
          <EmptyTitle>No sites match your filters</EmptyTitle>
          <EmptyDescription>Try adjusting or clearing your filters.</EmptyDescription>
        </Show>
      </EmptyHeader>
    </Empty>
  )
}

function sitesListParams(search: SearchParams) {
  const params: { q?: string; status?: "up" | "down" } = {};
  const q = typeof search.q == "string" ? search.q.trim() : undefined;
  if (q) params.q = q;
  if (search.status === "up" || search.status === "down") params.status = search.status;
  return params;
}

function SiteDetailLink(props: { slug: string; class?: string; children: JSX.Element }) {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <a
      href={paths.sites(props.slug)}
      class={props.class}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        navigate(paths.sites(props.slug), {
          state: { previous: location.pathname + location.search },
        });
      }}
    >
      {props.children}
    </a>
  )
}

export const route = defineFileRoute("/sites", {
  preload(args) {
    getSitesList(sitesListParams(args.location.query));
  }
})

export default function Sites(_props: RouteProps<typeof route>) {
  const [search, setSearch] = useSearchParams<{
    q: string,
    status: "all" | "up" | "down",
    view: "list" | "grid"
  }>()
  const isAdmin = useIsAdmin()
  const hasFilters = createMemo(() => {
    const q = typeof search.q == "string" ? search.q.trim() : "";
    return q.length > 0 || search.status === "up" || search.status === "down";
  })
  const sites = createMemo(() => getSitesList(sitesListParams(search)))

  return (
    <>
      <Title>Sites - Dockside</Title>

      <PageBody>
        <PageHeader>
          <PageTitle>Sites</PageTitle>
          <PageHeaderActions>
            <Show when={isAdmin()}>
              <AddSiteAction />
            </Show>
          </PageHeaderActions>
        </PageHeader>

        <PageContent>
          <FieldSet>
            <FieldLegend class="sr-only">Sites filter</FieldLegend>

            <FieldGroup
              class={[
                "grid grid-cols-[auto_auto_1fr] sm:grid-cols-[auto_auto_1fr_auto] grid-rows-2 sm:grid-rows-1 items-center",
                "[grid-template-areas:'search_search_search''status_view_.']",
                "sm:[grid-template-areas:'search_status_._view']",
              ]}
            >
              <Field class="[grid-area:search] relative h-fit sm:w-56">
                <FieldLabel for="site-search" class="sr-only">Search site</FieldLabel>
                <div class="w-fit pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 px-2">
                  <SearchIcon class="size-4 text-muted-foreground" />
                </div>
                <Input
                  type="search"
                  size="sm"
                  id="site-search"
                  class="pl-8"
                  placeholder="Search"
                  value={String(search.q ?? "")}
                  onInput={ev => setSearch({ q: ev.currentTarget.value })}
                />
              </Field>

              <ToggleGroup
              legend="Site status"
              class="[grid-area:status]"
                value={String(["all", "up", "down"].includes(search.status ?? "") ? search.status : "all")}
                onChange={value => setSearch({ status: value })}
              >
                <ToggleGroupItem value="all">
                  <span>All</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="up">
                  <span>Up</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="down">
                  <span>Down</span>
                </ToggleGroupItem>
              </ToggleGroup>

              <ToggleGroup
                legend="Sites view"
                class="[grid-area:view]"
                value={String(search.view == "grid" ? "grid": "list")}
                onChange={value => setSearch({view: value})}
              >
                <ToggleGroupItem value="list" title="List">
                  <ListSortDescendingIcon />
                  <span class="sr-only">List</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="grid" title="Grid">
                  <LayoutGridIcon />
                  <span class="sr-only">List</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </FieldGroup>
          </FieldSet>

          <Errored fallback={(err, reset) => (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><AlertCircleIcon /></EmptyMedia>
                <EmptyTitle>Failed to load sites</EmptyTitle>
                <EmptyDescription>{(err() as Error)?.message ?? "Something went wrong"}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button size="sm" variant="tonal" onClick={reset}>Try again</Button>
              </EmptyContent>
            </Empty>
          )}>
            <Loading
              fallback={search.view === "grid"
                ? <SitesGridSkeleton num={3} />
                : <SitesTableSkeleton num={3} />
              }
            >
              <Switch>
                <Match when={(search.view ?? "list") === "list"}>
                  <Table>
                    <TableCaption class="sr-only">Sites list</TableCaption>
                    <TableHeader>
                      <TableRow header>
                        <TableHead>Name/Slug</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Latest</TableHead>
                        <TableHead>Current</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead><span class="sr-only">Actions</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <For
                        each={sites().content}
                        keyed={item => item.id}
                        fallback={
                          <TableRow class="hover:bg-transparent!">
                            <TableCell colspan={6}>
                              <NoSitesFallback filtersEngaged={hasFilters()} isAdmin={isAdmin()} />
                            </TableCell>
                          </TableRow>
                        }
                      >
                        {(item) => (
                          <TableRow>
                            <TableCell>
                              <div class="flex items-center gap-2">
                                <GlobeIcon class="text-muted-foreground size-4" />
                                <div class="grid gap-1">
                                  <span class="font-medium text-md">{item().name}</span>
                                  <span class="text-xs text-muted-foreground">/{item().slug}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell class="text-muted-foreground">
                              <time datetime={item().createdAt}>{formatSmartDate(item().createdAt)}</time>
                            </TableCell>
                            <TableCell>
                              <Show when={item().latestDeployment} fallback={<span>-</span>}>
                                {(d) => (
                                  <div class="grid gap-1">
                                    <p class="flex items-center gap-1">
                                      <span>v{d().version}</span>
                                      {d().status !== "success" && <DeploymentStatus status={d().status} />}
                                    </p>
                                    <time datetime={d().createdAt} class="text-xs text-muted-foreground">{formatAbsoluteDate(d().createdAt)}</time>
                                  </div>
                                )}
                              </Show>
                            </TableCell>
                            <TableCell>{item().currentVersion != null ? `v${item().currentVersion}`: "-"}</TableCell>
                            <TableCell>
                              <SiteStatusBadge status={item().currentVersion == null ? null: item().up ? "up" : "down"} />
                            </TableCell>
                            <TableCell>
                              <SiteDetailLink slug={item().slug} class="block w-fit">
                                <ChevronRightIcon class="size-5 text-muted-foreground" />
                                <span class="sr-only">View details</span>
                                <div class="absolute inset-0" />
                              </SiteDetailLink>
                            </TableCell>
                          </TableRow>
                        )}
                      </For>
                    </TableBody>
                  </Table>
                </Match>
                <Match when={search.view === "grid"}>
                  <div class="grid grid-cols-[repeat(auto-fit,minmax(17.5rem,1fr))] gap-4">
                    <For each={sites().content} keyed={item => item.id} fallback={<NoSitesFallback filtersEngaged={hasFilters()} isAdmin={isAdmin()} />}>
                      {(item) => (
                        <Card class="relative">
                          <CardHeader class="relative">
                            <GlobeIcon class="text-muted-foreground" />
                            <CardTitle class="text-left text-lg">{item().name}</CardTitle>
                            <span class="text-left text-muted-foreground">/{item().slug}</span>
                            <div class="absolute right-0 px-(--card-spacing)">
                              <SiteStatusBadge status={item().currentVersion == null ? null: item().up ? "up" : "down"} />
                            </div>
                          </CardHeader>
                          <CardContent class="grid gap-2">
                            <p class="flex items-center justify-between">
                              <span class="text-muted-foreground">Created</span>
                              <time datetime={item().createdAt}>{formatSmartDate(item().createdAt)}</time>
                            </p>

                            <div class="flex items-center justify-between">
                              <span class="text-muted-foreground">Latest version</span>
                              <Show when={item().latestDeployment} fallback={<span>-</span>}>
                                {(d) => (
                                  <div class="flex items-center gap-2">
                                    <span>v{d().version}</span>
                                    {d().status !== "success" && <DeploymentStatus status={d().status} />}
                                  </div>
                                )}
                              </Show>
                            </div>
                          </CardContent>
                          <CardFooter>
                            <div class="flex items-center justify-between w-full">
                              <span class="text-muted-foreground">Current {item().currentVersion ? `v${item().currentVersion}` : "-"}</span>
                              <SiteDetailLink slug={item().slug} class="cursor-pointer group">
                                <ChevronRightIcon class="size-5 text-muted-foreground" />
                                <span class="sr-only">View details</span>
                                <div class="absolute inset-0 group-hover:bg-muted/25" />
                              </SiteDetailLink>
                            </div>
                          </CardFooter>
                        </Card>
                      )}
                    </For>
                  </div>
                </Match>
              </Switch>

              {/*<div class="flex items-center flex-wrap gap-4 sm:gap-8 justify-between text-muted-foreground">
                <p class="text-sm">Showing page {sites().number + 1} of {sites().totalPages}</p>
                <div class="flex items-center gap-1">
                  <Button variant="outlined" size="xs" disabled={sites().number === 0}>
                    <ChevronLeftIcon />
                    <span>Previous</span>
                  </Button>
                  <Button variant="outlined" size="xs" disabled={sites().number + 1 === sites().totalPages}>
                    <span>Next</span>
                    <ChevronRightIcon />
                  </Button>
                </div>
              </div>*/}
            </Loading>
          </Errored>
        </PageContent>
      </PageBody>
    </>
  )
}
