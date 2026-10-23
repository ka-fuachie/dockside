"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

import { children, createMemo, For, Match, merge, omit, Switch } from "solid-js"
import { ComponentProps } from "@solidjs/web"
import { Label } from "@/components/ui/label"
import { Show } from "solid-js"

function FieldSet(props: ComponentProps<"fieldset">) {
  const otherProps = omit(props, "class")

  return (
    <fieldset
      data-slot="field-set"
      class={cn(
        "flex flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        props.class
      )}
      {...otherProps}
    />
  )
}

function FieldLegend(props: ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  const mergedProps = merge({ variant: "legend" }, props)
  const otherProps = omit(mergedProps, "class", "variant")

  return (
    <legend
      data-slot="field-legend"
      data-variant={mergedProps.variant}
      class={cn(
        "mb-1.5 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base",
        mergedProps.class
      )}
      {...otherProps}
    />
  )
}

function FieldGroup(_props: ComponentProps<"div">) {
  const props = omit(_props, "class")
  return (
    <div
      data-slot="field-group"
      class={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4",
        _props.class
      )}
      {...props}
    />
  )
}

const fieldVariants = cva(
  "group/field flex w-full gap-2 data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

function Field(props: ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  const mergedProps = merge({ orientation: "vertical" as VariantProps<typeof fieldVariants>["orientation"] }, props)
  const otherProps = omit(mergedProps, "class", "orientation")

  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={mergedProps.orientation}
      class={cn(fieldVariants({ orientation: mergedProps.orientation }), mergedProps.class)}
      {...otherProps}
    />
  )
}

function FieldContent(props: ComponentProps<"div">) {
  const otherProps = omit(props, "class")

  return (
    <div
      data-slot="field-content"
      class={cn(
        "group/field-content flex flex-1 flex-col gap-0.5 leading-snug",
        props.class
      )}
      {...otherProps}
    />
  )
}

function FieldLabel(props: ComponentProps<typeof Label>) {
  const otherProps = omit(props, "class")

  return (
    <Label
      data-slot="field-label"
      class={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-muted/50 has-[>[data-slot=field]]:has-focus-visible]:border-ring has-[>[data-slot=field]]:has-focus-visible]:ring-3 has-[>[data-slot=field]]:has-focus-visible]:ring-ring/50 *:data-[slot=field]:p-2.5 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
        props.class
      )}
      {...otherProps}
    />
  )
}

function FieldTitle(props: ComponentProps<"div">) {
  const otherProps = omit(props, "class")

  return (
    <div
      data-slot="field-label"
      class={cn(
        "flex w-fit items-center gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50",
        props.class
      )}
      {...otherProps}
    />
  )
}

function FieldDescription(props: ComponentProps<"p">) {
  const otherProps = omit(props, "class")

  return (
    <p
      data-slot="field-description"
      class={cn(
        "text-left text-sm leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5",
        "last:mt-0 nth-last-2:-mt-1",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        props.class
      )}
      {...otherProps}
    />
  )
}

function FieldError(
  props: ComponentProps<"div"> & {
    errors?: Array<{ message?: string } | undefined>
  }
) {
  const otherProps = omit(props, "class", "errors", "children")

  const resolvedChildren = children(() => props.children)
  const uniqueErrors = createMemo(() => {
    if(!props.errors?.length) return null
    return [
      ...new Map(props.errors.map((error) => [error?.message, error])).values(),
    ]
  })
  const hasContent = () => resolvedChildren() != null || uniqueErrors() != null

  return (
    <Show when={hasContent()}>
      <div
        role="alert"
        data-slot="field-error"
        class={cn("text-sm text-left font-normal text-destructive", props.class)}
        {...otherProps}
      >
        <Switch>
          <Match when={resolvedChildren()}>{resolvedChildren()}</Match>
          <Match when={uniqueErrors() != null && uniqueErrors()!.length == 1}>
            {uniqueErrors()![0]?.message}
          </Match>
          <Match when={uniqueErrors() != null}>
            <ul class="ml-4 flex list-disc flex-col gap-1">
              <For each={uniqueErrors()}>
                {(error) => (
                  <Show when={error?.message}>
                    {(message) => <li>{message()}</li>}
                  </Show>
                )}
              </For>
            </ul>
          </Match>
        </Switch>
      </div>
    </Show>
  )
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet,
  FieldContent,
  FieldTitle,
}
