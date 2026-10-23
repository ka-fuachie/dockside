import { Title } from "@solidjs/meta"
import { action, useSearchParams, useSubmissions } from "@solidjs/router"
import { login, safeNext } from "../data/auth"
import { isServerError } from "../lib/server/error"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Logo from "@/components/logo"
import { Show } from "solid-js"

const loginAction = action(login)

const isInvalid = (issues: Record<string, string> | null, name: string) => {
  if(issues == null) return false
  if (name in issues) return issues[name].trim() != ""
  return false
}

export default function Login() {
  const [search] = useSearchParams()
  const submissions = useSubmissions(loginAction)
  const error = () => {
    const error = submissions.at(-1)?.error
      if(error == null) return null
      if(isServerError(error)) {
        return error
      }
      return {code: "", message: (error as Error).message, fields: null}
  }
  const issues = () => error()?.fields ?? null
  const errorMessage = () => {
    if(error()?.code == "BAD_CREDENTIALS") return "Invalid username or password"
    return null
  }

  return (
    <>
      <Title>Login - Dockside</Title>

      <main class="h-screen grid justify-center items-center">
        <div class="min-w-[min(100vw,25rem)] grid gap-6">
          <Logo class="text-6xl" />
          <h1 class="text-4xl text-left">Log in</h1>

          <div aria-live="polite">
            <Show when={errorMessage()}>
              {(message) => <p class="text-destructive text-left">{message()}</p>}
            </Show>
          </div>

          <form
            method="post"
            action={loginAction}
            class="group"
          >
            <input type="hidden" name="next" value={safeNext(search.next) ?? "/"} />

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
                  type="password"
                  id="password"
                  name="password"
                  aria-invalid={isInvalid(issues(), "password") ? "true": "false"}
                />
                {isInvalid(issues(), "password") && <FieldError>{issues()!.password}</FieldError>}
              </Field>

              <Field>
                <Button
                  type="submit"
                  class="group-aria-busy:opacity-50 group-aria-busy:pointer-events-none"
                >Log in</Button>
              </Field>
            </FieldGroup>
          </form>
        </div>
      </main>
    </>
  )
}
