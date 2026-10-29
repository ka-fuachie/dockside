import { ComponentProps, JSX } from "@solidjs/web"
import { Accessor, createContext, createEffect, createSignal, createUniqueId, omit, onSettled, ParentProps, Setter, useContext } from "solid-js"
import { Button } from "@/components/ui/button"
import { merge } from "solid-js"
import { cn } from "cn"
import { XIcon } from "@lucide/solid"
import { callEventHandler } from "@/lib/event"

type DialogContextValue = {
  dialogModalId: Accessor<string>
  setDialogModalIdSource: Setter<Accessor<string> | null>
}

const DialogContext = createContext<DialogContextValue>()

export function Dialog(props: ParentProps & { open?: boolean }) {
  const defaultDialogModalId = createUniqueId()
  const [dialogModalIdSource, setDialogModalIdSource] = createSignal<Accessor<string> | null>(null)
  const dialogModalId = () => {
    const source = dialogModalIdSource()
    if (source != null) {
      return source()
    }

    return defaultDialogModalId
  }

  createEffect(() => [props.open, dialogModalId()], ([open, modalId]) => {
    if(open == null) return

    const dialogEl = document.querySelector(`[id="${modalId}"]`)
    if (dialogEl == null || !(dialogEl instanceof HTMLDialogElement)) return

    if (open) {
      dialogEl.showModal()
    } else {
      dialogEl.close()
    }
  })

  return (
    <DialogContext value={{dialogModalId, setDialogModalIdSource}}>
      {props.children}
    </DialogContext>
  )
}

export function DialogTrigger(props: ComponentProps<typeof Button>) {
  const { dialogModalId } = useContext(DialogContext)
  const mergedProps = merge({size: "sm"} as Partial<ComponentProps<typeof Button>>, props)
  const otherProps = omit(mergedProps, "size", "onCommand", "onClick")

  return (
    <Button
      size={mergedProps.size}
      commandfor={dialogModalId()}
      command="show-modal"
      onCommand={[ev => {
        ev.preventDefault()
      }, mergedProps.onCommand]}
      onClick={[() => {
        const dialogEl = document.querySelector(`[id="${dialogModalId()}"]`)
        if (dialogEl != null && dialogEl instanceof HTMLDialogElement) {
          dialogEl.showModal()
        }
      }, mergedProps.onClick]}
      {...otherProps}
    >
      {mergedProps.children}
    </Button>
  )
}

function resolveRef<T extends HTMLElement>(node: T, ref: JSX.Ref<T> | null) {
  if (ref == null) return
  if (typeof ref === "function") ref(node)
  if (Array.isArray(ref)) {
    for (const r of ref) {
      resolveRef(node, r)
    }
  }
}

export function DialogModal(props: ComponentProps<"dialog">) {
  const { dialogModalId, setDialogModalIdSource } = useContext(DialogContext)
  const otherProps = omit(props, "id", "class", "children", "onClick", "onCancel", "ref")
  let dialogModalRef: HTMLDialogElement | null = null

  onSettled(() => {
    const id = props.id as string
    if(id == null) return
    setDialogModalIdSource(() => () => id)
    return () => setDialogModalIdSource(null)
  })

  return (
    <dialog
      id={dialogModalId()}
      class={cn("w-full h-full max-w-screen max-h-screen m-0 focus:outline-none bg-transparent backdrop:bg-black/25 backdrop:backdrop-blur-xs py-12 px-(--dialog-body-padding-inline) open:grid open:items-center", props.class)}
      style={{
        "--dialog-body-max-width": "30rem",
        "--dialog-body-min-padding-inline": "1rem",
        "--dialog-body-padding-inline": "max(calc((100vw - var(--dialog-body-max-width))/2), var(--dialog-body-min-padding-inline))",
      }}
      ref={node => {
        dialogModalRef = node
        resolveRef(node, props.ref)
      }}
      onClick={(ev) => {
        try {
          if (dialogModalRef != null && ev.target === dialogModalRef) {
            dialogModalRef.close()
          }
        } finally {
          callEventHandler(props.onClick, ev)
        }
      }}
      onCancel={ev => {
        try {
          ev.preventDefault()
        } finally {
          callEventHandler(props.onCancel, ev)
        }
      }}
      {...otherProps}
    >
      {props.children}
    </dialog>
  )
}

export function DialogBody(props: ComponentProps<"div">) {
  const otherProps = omit(props, "class", "children")
  return (
    <div
      class={cn("relative w-full rounded-xl bg-popover text-foreground ring-1 ring-foreground/10 p-6 grid gap-2", props.class)}
      {...otherProps}
    >
      {props.children}
    </div>
  )
}

export function DialogHeader(props: ComponentProps<"header">) {
  const { dialogModalId } = useContext(DialogContext)
  const otherProps = omit(props, "class", "children")

  return (
    <header {...otherProps}>
      <div class="absolute right-0 top-0 p-4">
        <Button
          variant="ghost"
          size="icon-sm"
          class="text-foreground [&_svg]:size-6"
          command="close"
          commandfor={dialogModalId()}
          onCommand={[ev => {
            ev.preventDefault()
          }, props.onCommand]}
          onClick={[() => {
            const dialogEl = document.querySelector(`[id="${dialogModalId()}"]`)
            if (dialogEl != null && dialogEl instanceof HTMLDialogElement) {
              dialogEl.close()
            }
          }, props.onClick]}
        >
          <XIcon />
          <span class="sr-only">Close</span>
        </Button>
      </div>

      {props.children}
    </header>
  )
}
