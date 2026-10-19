import { defineFileRoute } from "@solidjs/router/fs"
import { getSite } from "../../data/sites"
import { RouteProps } from "@solidjs/router"
import { createMemo, Errored } from "solid-js"
import { Loading } from "solid-js"
import { Title } from "@solidjs/meta"
import { paths } from "../../router"

export const route = defineFileRoute("/sites/:id", {
  preload({ params }) {
    if (params.slug != null) {
      getSite(params.slug)
    }
  }
})

export default function SiteDetail(props: RouteProps<typeof route>) {
  const site = createMemo(() => {
    if (props.params.slug == null) {
      throw new Error("invalid site slug")
    }
    return getSite(props.params.slug)
  })

  return (
    <div>
      <a href={paths.sites()}>Back to sites</a>
      <Errored
        fallback={(err, reset) => (
          <>
            <p>Error loading site</p>
            <p>{(err() as Error)?.message}</p>
            <button type="button" onClick={reset}>Retry</button>
          </>
        )}
      >
        <Loading fallback={<p>Loading site...</p>}>
          <Title>{site().name} - Dockside</Title>
          <pre textContent={JSON.stringify(site(), null, 2)} />
        </Loading>
      </Errored>
    </div>
  )
}
