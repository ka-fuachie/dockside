// import { defineFileRoute } from "@solidjs/router/fs"
// import { getSitesList } from "@/data/sites"
// import { createMemo, Errored, For, Loading } from "solid-js"
// import { Title } from "@solidjs/meta"
// import { RouteProps, useSearchParams } from "@solidjs/router"
// import { Button } from "@/components/ui/button"
// import { LayoutGridIcon, ListSortDescendingIcon, PlusIcon } from "@lucide/solid"
// import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
// import { Input } from "@/components/ui/input"
// import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
// import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Switch } from "solid-js"
// import { Match } from "solid-js"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { createForm } from "@tanstack/solid-form"
// import * as z from "zod"
// import { isInvalid } from "@/lib/form"
// import { slugify } from "@/lib/utils"
//
// function AddSiteAction() {
//   const form = createForm(() => ({
//     defaultValues: {
//       name: "",
//       slug: ""
//     },
//     validators: [{
//       triggers: ["change"],
//       run: z.object({
//         name: z.string().min(1, "Name is required"),
//         slug: z.regex(/^[a-z0-9-]*$/, "Slug should be lowercase, numbers or hyphen")
//       })
//     }],
//     onSubmit: async ({ value }) => {
//     }
//   }))
//
//   return (
//     <Dialog>
//       <DialogTrigger>
//         <PlusIcon />
//         <span>Add site</span>
//       </DialogTrigger>
//
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>New Site</DialogTitle>
//         </DialogHeader>
//
//         <form
//           method="post"
//           onSubmit={(ev) => {
//             ev.preventDefault()
//             ev.stopPropagation()
//             form.handleSubmit()
//           }}
//         >
//           <FieldGroup>
//             <form.Field name="name">
//               {(field) => (
//                 <Field data-invalid={isInvalid(field())}>
//                   <FieldLabel for={field().name}>Name</FieldLabel>
//                   <Input
//                     type="text"
//                     id={field().name}
//                     name={field().name}
//                     value={field().value}
//                     onBlur={field().handleBlur}
//                     onInput={ev => field().handleChange(ev.currentTarget.value)}
//                     aria-invalid={isInvalid(field())}
//                   />
//                   {isInvalid(field()) && <FieldError errors={field().meta.errors} />}
//                 </Field>
//               )}
//             </form.Field>
//
//             <form.Field name="slug">
//               {(field) => (
//                 <Field data-invalid={isInvalid(field())}>
//                   <FieldLabel for={field().name}>Slug</FieldLabel>
//                   <Input
//                     type="text"
//                     id={field().name}
//                     name={field().name}
//                     value={field().value}
//                     placeholder={slugify(form.getFieldValue("name"))}
//                     onBlur={field().handleBlur}
//                     onInput={ev => field().handleChange(ev.currentTarget.value)}
//                     aria-invalid={isInvalid(field())}
//                   />
//                   {isInvalid(field()) && <FieldError errors={field().meta.errors} />}
//                 </Field>
//               )}
//             </form.Field>
//
//             <Button type="submit">Add Site</Button>
//           </FieldGroup>
//         </form>
//       </DialogContent>
//     </Dialog>
//   )
// }
//
// export const route = defineFileRoute("/sites", {
//   preload() {
//     return getSitesList()
//   }
// })
//
// export default function Sites(props: RouteProps<typeof route>) {
//   const sites = createMemo(() => props.data)
//   const [search, setSearch] = useSearchParams<{
//     q: string,
//     status: "all" | "up" | "down",
//     view: "list" | "grid"
//   }>()
//
//   return (
//     <>
//       <Title>Sites - Dockside</Title>
//
//       <div class="px-2 py-8">
//         <div class="flex justify-between items-center">
//           <h1 class="text-5xl">Sites</h1>
//           <div>
//             <AddSiteAction />
//           </div>
//         </div>
//
//         <div>
//           <FieldSet>
//             <FieldLegend class="sr-only">Sites filter</FieldLegend>
//
//             <FieldGroup class="flex flex-row justify-between">
//               <div class="flex gap-4">
//                 <Field>
//                   <FieldLabel for="site-search" class="sr-only">Search site</FieldLabel>
//                   <Input
//                     type="search"
//                     id="site-search"
//                     value={String(search.q ?? "")}
//                     onInput={ev => setSearch({ q: ev.currentTarget.value })}
//                   />
//                 </Field>
//
//                 <Field>
//                   <FieldLabel for="sites-status" class="sr-only">Site status</FieldLabel>
//                   <ToggleGroup
//                     type="single"
//                     spacing={0}
//                     variant="outline"
//                     id="sites-status"
//                     value={String(["all", "up", "down"].includes(search.status ?? "") ? search.status : "all")}
//                     onChange={value => setSearch({ status: value })}
//                   >
//                     <ToggleGroupItem value="all">
//                       <span>All</span>
//                     </ToggleGroupItem>
//                     <ToggleGroupItem value="up">
//                       <span>Up</span>
//                     </ToggleGroupItem>
//                     <ToggleGroupItem value="down">
//                       <span>Down</span>
//                     </ToggleGroupItem>
//                   </ToggleGroup>
//                 </Field>
//               </div>
//
//               <div>
//                 <Field>
//                   <FieldLabel for="sites-view" class="sr-only">Sites view</FieldLabel>
//                   <ToggleGroup
//                     type="single"
//                     spacing={0}
//                     variant="outline"
//                     id="sites-view"
//                     value={String(search.view == "grid" ? "grid": "list")}
//                     onChange={value => setSearch({view: value})}
//                   >
//                     <ToggleGroupItem value="list">
//                       <ListSortDescendingIcon />
//                       <span class="sr-only">List</span>
//                     </ToggleGroupItem>
//                     <ToggleGroupItem value="grid">
//                       <LayoutGridIcon />
//                       <span class="sr-only">List</span>
//                     </ToggleGroupItem>
//                   </ToggleGroup>
//                 </Field>
//               </div>
//             </FieldGroup>
//           </FieldSet>
//
//           <Errored fallback={(err, reset) => (
//             <>
//               <p>Error loading sites</p>
//               <p>{(err() as Error)?.message}</p>
//               <button type="button" onClick={reset}>Retry</button>
//             </>
//           )}>
//             <Loading fallback={<p>Loading Sites...</p>}>
//               <Switch>
//                 <Match when={(search.view ?? "list") === "list"}>
//                   <Table>
//                     <TableCaption class="sr-only">Sites list</TableCaption>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>Name</TableHead>
//                         <TableHead>Slug</TableHead>
//                         <TableHead>Created</TableHead>
//                         <TableHead>Current</TableHead>
//                         <TableHead>Status</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       <For each={(console.log(sites()), sites()).content}>
//                         {(item) => (
//                           <TableRow>
//                             <TableCell>{item.name}</TableCell>
//                             <TableCell>{item.slug}</TableCell>
//                             <TableCell>{item.createdAt}</TableCell>
//                             <TableCell>{item.currentVersion}</TableCell>
//                             <TableCell>{item.up ? "up": "down"}</TableCell>
//                           </TableRow>
//                         )}
//                       </For>
//                     </TableBody>
//                   </Table>
//                 </Match>
//                 <Match when={search.view === "grid"}>
//                   <div class="grid grid-cols-[repeat(auto-fit,minmax(17.5rem,1fr))] gap-4">
//                     <For each={sites().content} keyed={item => item.id}>
//                       {(item) => (
//                         <Card>
//                           <CardHeader>
//                             <CardTitle>{item().name}</CardTitle>
//                           </CardHeader>
//                           <CardContent>
//                             <p><span class="sr-only">Slug:</span><span>{item().slug}</span></p>
//                             <p>v{item().currentVersion ?? "-"} - {item().createdAt}</p>
//                           </CardContent>
//                         </Card>
//                       )}
//                     </For>
//                   </div>
//                 </Match>
//               </Switch>
//             </Loading>
//           </Errored>
//         </div>
//       </div>
//     </>
//   )
// }
