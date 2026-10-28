"use client"

import { createContext, createProjection } from "solid-js"
import { useContext } from "solid-js"
import { JSX } from "@solidjs/web"
import { FieldLegend, FieldSet } from "@/components/ui/field"
import { ComponentProps } from "@solidjs/web"

type ToggleGroupProps = {
  legend: string
  value: string
  onChange: (value: string) => void
  children: JSX.Element
  class?: ComponentProps<"div">["class"]
}

type ToggleGroupItemProps = {
  title?: string
  value: string
  children: JSX.Element
}

type ToggleGroupContextValue = {
  legend: string
  value: string
}

const ToggleGroupContext = createContext<ToggleGroupContextValue>()

function ToggleGroup(props: ToggleGroupProps) {
  const context = createProjection(draft => {
    draft.legend = props.legend
    draft.value = props.value
  }, {} as ToggleGroupContextValue)

  return (
    <FieldSet
      class={props.class}
      onChange={ev => {
        const input = ev.target
        if (!(input instanceof HTMLInputElement)) return
        if (input.name !== context.legend) return
        props.onChange(input.value)
      }}
    >
      <FieldLegend class="sr-only">{props.legend}</FieldLegend>
      <div class={"flex border border-muted-foreground/30 rounded-md w-fit"}>
        <ToggleGroupContext value={context}>
          {props.children}
        </ToggleGroupContext>
      </div>
    </FieldSet>
  )
}

function ToggleGroupItem(props: ToggleGroupItemProps) {
  const context = useContext(ToggleGroupContext)
  const id = () => context.legend.toLowerCase().replace(/\s+/g, "-") + "-" + props.value
  const checked = () => context.value === props.value

  return (
    <div
      title={props.title}
      class={[
        "catch-focus [--offset:2px] w-fit not-last:border-r border-muted-foreground/30 first:rounded-l-md last:rounded-r-md text-sm [&_svg]:size-4 hover:bg-muted",
        checked() && "bg-muted-foreground/20 hover:bg-muted-foreground/20"
      ]}
    >
      <label for={id()} class="px-2 py-1.5 grid items-center justify-center cursor-pointer">{props.children}</label>
      <input
        type="radio"
        id={id()}
        class="sr-only"
        name={context.legend}
        value={props.value}
        checked={checked()}
      />
    </div>
  )
}

export { ToggleGroup, ToggleGroupItem }
