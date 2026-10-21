import { Title } from "@solidjs/meta"
import { action, useAction, useSearchParams, useSubmissions } from "@solidjs/router"
import { login, safeNext } from "../data/auth"
import { isServerError } from "../lib/server/error"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createForm } from "@tanstack/solid-form"
import "zod/compile"
import * as z from "zod"
import { isInvalid } from "@/lib/form"
import { toast } from "@/lib/solid-sonner"
import Logo from "@/components/logo"

const loginAction = action(login)

export default function Login() {
  const [search] = useSearchParams()
  const form = createForm(() => ({
    defaultValues: {
      username: "",
      password: ""
    },
    validators: [{
      triggers: ["change"],
      run: z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(1, "Password is required")
      })
    }],
    onSubmit: async ({ value }) => {
      const formData = new FormData()
      for (const [k, v] of Object.entries(value)) {
        formData.set(k, v)
      }

      try {
        await login(formData)
      } catch (err) {
        if (isServerError(err) && err.code === "BAD_CREDENTIALS") {
          toast.error("Invalid username or password")
        } else {
          toast.error("Unknown error")
        }
      }
    }
  }))

  return (
    <>
      <Title>Login - Dockside</Title>

      <main class="h-screen grid justify-center items-center">
        <div class="min-w-[min(100vw,25rem)] grid gap-6">
          <Logo class="text-6xl" />
          <h1 class="text-4xl text-left">Log in</h1>

          <form
            method="post"
            action={loginAction.url}
            onSubmit={(ev) => {
              ev.preventDefault()
              ev.stopPropagation()
              form.handleSubmit()
            }}
          >
            <input type="hidden" name="next" value={safeNext(search.next) ?? "/"} />

            <FieldGroup>
              <form.Field name="username">
                {(field) => (
                  <Field data-invalid={isInvalid(field())}>
                    <FieldLabel for={field().name}>Username</FieldLabel>
                    <Input
                      type="text"
                      id={field().name}
                      name={field().name}
                      value={field().value}
                      onBlur={field().handleBlur}
                      onInput={ev => field().handleChange(ev.currentTarget.value)}
                      aria-invalid={isInvalid(field())}
                    />
                    {isInvalid(field()) && <FieldError errors={field().meta.errors} />}
                  </Field>
                )}
              </form.Field>

              <form.Field name="password">
                {(field) => (
                  <Field data-invalid={isInvalid(field())}>
                    <FieldLabel for={field().name}>Password</FieldLabel>
                    <Input
                      type="password"
                      id={field().name}
                      name={field().name}
                      value={field().value}
                      onBlur={field().handleBlur}
                      onInput={ev => field().handleChange(ev.currentTarget.value)}
                      aria-invalid={isInvalid(field())}
                    />
                    {isInvalid(field()) && <FieldError errors={field().meta.errors} />}
                  </Field>
                )}
              </form.Field>

              <Field>
                <Button type="submit" disabled={form.state.isSubmitting}>Log in</Button>
              </Field>
            </FieldGroup>
          </form>
        </div>
      </main>
    </>
  )
}
