import { defineFileRoute } from "@solidjs/router/fs"
import { action, RouteProps, SearchParams, useAction, useSearchParams, useSubmissions } from "@solidjs/router"
import { createMemo, createSignal, Errored, For, Loading, Show } from "solid-js"
import { Title } from "@solidjs/meta"
import { Button } from "@/components/ui/button"
import { AlertCircleIcon, PlusIcon, SearchIcon, TrashIcon, UserIcon } from "@lucide/solid"
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogBody, DialogHeader, DialogModal, DialogTrigger } from "@/components/ui/dialog"
import { PageBody, PageContent, PageHeader, PageHeaderActions, PageTitle } from "@/components/page"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatSmartDate } from "@/lib/date"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Repeat } from "solid-js"
import { createUser, deleteUser, getUsersList } from "@/data/users"
import { useUser } from "@/context/user"
import { isInvalid, useSubmissionsError } from "@/lib/form"
import { Badge } from "@/components/ui/badge"
import { cn } from "cn"
import { StatusStyles } from "@/components/site-badges"
import { createOptimistic } from "solid-js"

const createUserAction = action(createUser)
const deleteUserAction = action(deleteUser)

function AddUserAction() {
  const submissions = useSubmissions(createUserAction)
  const { errorMessage, issues, clearErrors } = useSubmissionsError(submissions)
  let formRef: HTMLFormElement | null = null
  let dialogRef: HTMLDialogElement | null = null

  createUserAction.onSettled((submission) => {
    if (submission.error) return
    clearErrors()
    formRef?.reset()
    dialogRef?.close()
  })

  return (
    <Dialog>
      <DialogTrigger>
        <PlusIcon />
        <span>Add user</span>
      </DialogTrigger>

      <DialogModal
        ref={node => dialogRef = node}
        onClose={() => {
          clearErrors()
          formRef?.reset()
        }}
      >
        <DialogBody>
          <DialogHeader>
            <h2 class="text-xl text-left">New User</h2>
          </DialogHeader>

          <div aria-live="polite">
            <Show when={errorMessage()}>
              {(message) => <p class="text-destructive text-left">{message()}</p>}
            </Show>
          </div>

          <form
            method="post"
            action={createUserAction}
            ref={node => formRef = node}
          >
            <FieldGroup>
              <Field data-invalid={String(isInvalid(issues(), "username"))}>
                <FieldLabel for="username">Username</FieldLabel>
                <Input
                  type="text"
                  id="username"
                  name="username"
                  aria-invalid={isInvalid(issues(), "username") ? "true": "false"}
                />
                {isInvalid(issues(), "username") && <FieldError>{issues()!.username}</FieldError>}
              </Field>

              <Field data-invalid={String(isInvalid(issues(), "password"))}>
                <FieldLabel for="password">Password</FieldLabel>
                <Input
                  type="text"
                  id="password"
                  name="password"
                  aria-invalid={isInvalid(issues(), "password") ? "true": "false"}
                />
                {isInvalid(issues(), "password") && <FieldError>{issues()!.password}</FieldError>}
              </Field>

              <Field data-invalid={String(isInvalid(issues(), "role"))}>
                <FieldLabel for="role">Role</FieldLabel>
                <Select
                  id="role"
                  name="role"
                  aria-invalid={isInvalid(issues(), "role") ? "true": "false"}
                >
                  <option value="DEV">Dev</option>
                  <option value="ADMIN">Admin</option>
                </Select>
                {isInvalid(issues(), "role") && <FieldError>{issues()!.role}</FieldError>}
              </Field>

              <Field class="items-end">
                <Button type="submit" class="w-fit!">Add User</Button>
              </Field>
            </FieldGroup>
          </form>
        </DialogBody>
      </DialogModal>
    </Dialog>
  )
}

function UsersTableSkeleton(props: { num: number }) {
  return (
    <Table>
      <TableCaption class="sr-only">Loading users</TableCaption>
      <TableHeader>
        <TableRow header>
          <TableHead>Username</TableHead>
          <TableHead>Date added</TableHead>
          <TableHead>Role</TableHead>
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
                  <Skeleton class="h-4 w-28" />
                </div>
              </TableCell>
              <TableCell><Skeleton class="h-4 w-24" /></TableCell>
              <TableCell><Skeleton class="h-6 w-16 rounded-full" /></TableCell>
              <TableCell><Skeleton class="size-8 rounded-md" /></TableCell>
            </TableRow>
          )}
        </Repeat>
      </TableBody>
    </Table>
  )
}

function NoUsersFallback(props: { filtersEngaged: boolean }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon"><UserIcon /></EmptyMedia>
        <Show
          when={props.filtersEngaged}
          fallback={
            <>
              <EmptyTitle>No users yet</EmptyTitle>
              <EmptyDescription>Add your first user to get started.</EmptyDescription>
            </>
          }
        >
          <EmptyTitle>No users match your filters</EmptyTitle>
          <EmptyDescription>Try adjusting or clearing your filters.</EmptyDescription>
        </Show>
      </EmptyHeader>
    </Empty>
  )
}

type UserDeleteTarget = {
  id: number
  username: string
}

function createUserDeleteTarget() {
  const [deleteTarget, setDeleteTarget] = createSignal<UserDeleteTarget | null>(null)
  const requestDeleteUser = (id: number, username: string) => setDeleteTarget({id,username});
  const cancelDeleteUser = () => setDeleteTarget(null);

  return [deleteTarget, { requestDeleteUser, cancelDeleteUser }] as const
}

function ConfirmDeleteUserDialog(props: { target: UserDeleteTarget | null, onCancel: () => void }) {
  const deleteUser = useAction(deleteUserAction)
  const submissions = useSubmissions(deleteUserAction)
  const { errorMessage, clearErrors } = useSubmissionsError(submissions)
  const [isDeleting, setIsDeleting] = createOptimistic(false)

  deleteUserAction
    .onSubmit(() => {
      setIsDeleting(true)
    })
    .onSettled((submission) => {
      if (submission.error) return
      clearErrors()
      props.onCancel()
    })

  return (
    <Dialog open={props.target != null}>
      <DialogModal
        onClose={() => {
          clearErrors()
          props.onCancel()
        }}
      >
        <DialogBody>
          <Show when={props.target}>
            {(target) => (
              <>
                <DialogHeader>
                  <h2 class="text-xl text-left">Delete user "{target().username}"?</h2>
                </DialogHeader>

                <p class="text-left text-popover-foreground">This action cannot be undone</p>

                <div aria-live="polite">
                  <Show when={errorMessage()}>
                    {(message) => <p class="text-destructive text-left">{message()}</p>}
                  </Show>
                </div>

                <div class="flex flex-row-reverse items-center gap-2">
                  <Button
                    class="bg-destructive text-destructive-foreground"
                    disabled={isDeleting()}
                    onClick={() => deleteUser(target().id).catch(() => {})}
                  >Delete</Button>
                  <Button variant="tonal" onClick={props.onCancel}>Cancel</Button>
                </div>
              </>
            )}
          </Show>
        </DialogBody>
      </DialogModal>
    </Dialog>
  )
}

function usersListParams(search: SearchParams) {
  // Keys with explicit `undefined` values make the args "not JSON-safe" for
  // the server-functions transport (isJSONSafe rejects non-object owns);
  // only assign keys we actually want.
  const params: { q?: string; role?: "ADMIN" | "DEV" } = {};
  const q = typeof search.q == "string" ? search.q.trim() : undefined;
  if (q) params.q = q;
  if (search.role === "admin") params.role = "ADMIN";
  else if (search.role === "dev") params.role = "DEV";
  return params;
}

export const route = defineFileRoute("/users", {
  preload(args) {
    getUsersList(usersListParams(args.location.query));
  }
})

export default function Users(_props: RouteProps<typeof route>) {
  const [search, setSearch] = useSearchParams<{
    q: string,
    role: "all" | "admin" | "dev",
  }>()
  const hasFilters = createMemo(() => {
    const q = typeof search.q == "string" ? search.q.trim() : "";
    return q.length > 0 || search.role === "admin" || search.role === "dev";
  })
  const users = createMemo(() => getUsersList(usersListParams(search)))
  const currentUser = useUser()
  const [deleteTarget, { requestDeleteUser, cancelDeleteUser }] = createUserDeleteTarget()

  return (
    <>
      <Title>Users - Dockside</Title>

      <ConfirmDeleteUserDialog
        target={deleteTarget()}
        onCancel={() => cancelDeleteUser()}
      />

      <PageBody>
        <PageHeader>
          <PageTitle>Users</PageTitle>
          <PageHeaderActions>
            <AddUserAction />
          </PageHeaderActions>
        </PageHeader>

        <PageContent>
          <FieldSet>
            <FieldLegend class="sr-only">Users filter</FieldLegend>

            <FieldGroup
              class={[
                "grid grid-cols-[auto_auto] sm:grid-cols-[auto_auto_1fr] items-center",
                "[grid-template-areas:'search_search''role_.']",
                "sm:[grid-template-areas:'search_role_.']",
              ]}
            >
              <Field class="[grid-area:search] relative h-fit sm:w-56">
                <FieldLabel for="user-search" class="sr-only">Search user</FieldLabel>
                <div class="w-fit pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 px-2">
                  <SearchIcon class="size-4 text-muted-foreground" />
                </div>
                <Input
                  type="search"
                  size="sm"
                  id="user-search"
                  class="pl-8"
                  placeholder="Search"
                  value={String(search.q ?? "")}
                  onInput={ev => setSearch({ q: ev.currentTarget.value })}
                />
              </Field>

              <ToggleGroup
                legend="User role"
                class="[grid-area:role]"
                value={String(["all", "admin", "dev"].includes(search.role ?? "") ? search.role : "all")}
                onChange={value => setSearch({ role: value })}
              >
                <ToggleGroupItem value="all">
                  <span>All</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="admin">
                  <span>Admin</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="dev">
                  <span>Dev</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </FieldGroup>
          </FieldSet>

          <Errored fallback={(err, reset) => (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><AlertCircleIcon /></EmptyMedia>
                <EmptyTitle>Failed to load users</EmptyTitle>
                <EmptyDescription>{(err() as Error)?.message ?? "Something went wrong"}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button size="sm" variant="tonal" onClick={reset}>Try again</Button>
              </EmptyContent>
            </Empty>
          )}>
            <Loading fallback={<UsersTableSkeleton num={3} />}>
              <Table>
                <TableCaption class="sr-only">Users list</TableCaption>
                <TableHeader>
                  <TableRow header>
                    <TableHead>Username</TableHead>
                    <TableHead>Date added</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead><span class="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <For
                    each={users().content}
                    keyed={item => item.id}
                    fallback={
                      <TableRow class="hover:bg-transparent!">
                        <TableCell colspan={4}>
                          <NoUsersFallback filtersEngaged={hasFilters()} />
                        </TableCell>
                      </TableRow>
                    }
                  >
                    {(item) => (
                      <TableRow>
                        <TableCell>
                          <div class="flex items-center gap-2">
                            <UserIcon class="text-muted-foreground size-4" />
                            <div class="flex items-center gap-2">
                              <span class="font-medium">{item().username}</span>
                              <Show when={item().username === currentUser().username}>
                                <Badge class={cn(StatusStyles.green)}>you</Badge>
                              </Show>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell class="text-muted-foreground">
                          <time datetime={item().createdAt}>{formatSmartDate(item().createdAt)}</time>
                        </TableCell>
                        <TableCell>
                          <Badge class={cn(StatusStyles.gray)}>
                            {item().role}
                          </Badge>
                        </TableCell>
                        <TableCell class="w-fit">
                          <Show when={item().username !== currentUser().username}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              class="text-destructive"
                              onClick={() => {
                                requestDeleteUser(item().id, item().username)
                              }}
                            >
                              <TrashIcon />
                              <span class="sr-only">Delete user</span>
                            </Button>
                          </Show>
                        </TableCell>
                      </TableRow>
                    )}
                  </For>
                </TableBody>
              </Table>
            </Loading>
          </Errored>
        </PageContent>
      </PageBody>
    </>
  )
}
