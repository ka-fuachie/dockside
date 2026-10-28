import { defineFileRoute } from "@solidjs/router/fs"
import { createSite, getSitesList } from "@/data/sites"
import { createMemo, Errored, For, Loading, Show } from "solid-js"
import { Title } from "@solidjs/meta"
import { action, RouteProps, useSearchParams, useSubmissions } from "@solidjs/router"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, GlobeIcon, LayoutGridIcon, ListSortDescendingIcon, PlusIcon, SearchIcon } from "@lucide/solid"
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

export const route = defineFileRoute("/sites", {
  preload() {
    return getSitesList()
  }
})

export default function Sites(props: RouteProps<typeof route>) {
  const sites = createMemo(() => props.data)
  const [search, setSearch] = useSearchParams<{
    q: string,
    status: "all" | "up" | "down",
    view: "list" | "grid"
  }>()

  return (
    <>
      <Title>Sites - Dockside</Title>

      <PageBody>
        <PageHeader>
          <PageTitle>Sites</PageTitle>
          <PageHeaderActions>
            <AddSiteAction />
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
              <Field class="[grid-area:search] relative h-fit">
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
            <>
              <p>Error loading sites</p>
              <p>{(err() as Error)?.message}</p>
              <button type="button" onClick={reset}>Retry</button>
            </>
          )}>
            <Loading fallback={<p>Loading Sites...</p>}>
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
                      <For each={sites().content} keyed={item => item.id}>
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
                            <TableCell>
                              <time datetime={item().createdAt}>{formatSmartDate(item().createdAt)}</time>
                            </TableCell>
                            <TableCell>
                              <div class="grid gap-1">
                                <p class="flex items-center gap-1">
                                  <span>v12</span>
                                  <DeploymentStatus status="running" />
                                </p>
                                <time datetime={new Date().toISOString()} class="text-xs text-muted-foreground">{formatAbsoluteDate(new Date().toISOString())}</time>
                              </div>
                            </TableCell>
                            <TableCell>{item().currentVersion != null ? `v${item().currentVersion}`: "-"}</TableCell>
                            <TableCell>
                              <SiteStatusBadge status={item().currentVersion == null ? null: item().up ? "up" : "down"} />
                            </TableCell>
                            <TableCell>
                              <a href={paths.sites(item().slug)} class="block w-fit">
                                <ChevronRightIcon class="size-5 text-muted-foreground" />
                                <span class="sr-only">View details</span>
                                <div class="absolute inset-0" />
                              </a>
                            </TableCell>
                          </TableRow>
                        )}
                      </For>
                    </TableBody>
                  </Table>
                </Match>
                <Match when={search.view === "grid"}>
                  <div class="grid grid-cols-[repeat(auto-fit,minmax(17.5rem,1fr))] gap-4">
                    <For each={sites().content} keyed={item => item.id}>
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
                              <div class="flex items-center gap-2">
                                <span>v12</span>
                                <DeploymentStatus status="running" />
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter>
                            <div class="flex items-center justify-between w-full">
                              <span class="text-muted-foreground">Current {item().currentVersion ? `v${item().currentVersion}` : "-"}</span>
                              <a href={paths.sites(item().slug)} class="cursor-pointer group">
                                <ChevronRightIcon class="size-5 text-muted-foreground" />
                                <span class="sr-only">View details</span>
                                <div class="absolute inset-0 group-hover:bg-muted/25" />
                              </a>
                            </div>
                          </CardFooter>
                        </Card>
                      )}
                    </For>
                  </div>
                </Match>
              </Switch>

              <div class="flex items-center flex-wrap gap-4 sm:gap-8 justify-between text-muted-foreground">
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
              </div>
            </Loading>
          </Errored>
        </PageContent>
      </PageBody>
    </>
  )
}
