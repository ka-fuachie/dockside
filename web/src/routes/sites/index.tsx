import { defineFileRoute } from "@solidjs/router/fs"
import { getSitesList } from "../../data/sites"
import { createMemo, Errored, For, Loading } from "solid-js"
import { Title } from "@solidjs/meta"
import { paths } from "../../router"

export const route = defineFileRoute("/sites", {
  preload() {
    getSitesList()
  }
})

export default function Sites() {
  const sites = createMemo(() => getSitesList())

  return (
    <div>
      <Title>Sites - Dockside</Title>
      <h1>Sites</h1>
      <div>
        <Errored fallback={(err, reset) => (
          <>
            <p>Error loading sites</p>
            <p>{(err() as Error)?.message}</p>
            <button type="button" onClick={reset}>Retry</button>
          </>
        )}>
          <Loading fallback={<p>Loading Sites...</p>}>
            <ul>
              <For each={sites().content}>
                {(item) => (
                  <li>
                    <p>{item.name}</p>
                    <a href={paths.sites(item.slug)}>Details {item.slug}</a>
                  </li>
                )}
              </For>
            </ul>
          </Loading>
        </Errored>
      </div>
    </div>
  )
}
