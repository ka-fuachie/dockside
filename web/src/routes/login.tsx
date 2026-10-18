import { Title } from "@solidjs/meta"
import { action, useSubmissions } from "@solidjs/router"
import { login } from "../data/auth"
import { Show } from "solid-js"
import { isServerError } from "../lib/server/error"

const loginAction = action(login)

export default function Login() {
  const submissions = useSubmissions(loginAction)
  const issues = () => {
    const error = submissions.at(-1)?.error
    if (isServerError(error)) {
      return error.fields ?? {}
    }
    return {}
  }

  return (
    <main>
      <Title>Dockside - Login</Title>
      <h1>Log in</h1>

      <form method="post" action={loginAction}>
        <div class="grid">
          <div>
            <label for="username">Username</label>
            <input id="username" name="username" type="text" required aria-invalid={issues().username ? "true" : undefined} />
            <Show when={issues().username}>{(message) => <p role="alert">{message()}</p>}</Show>
          </div>

          <div>
            <label for="password">Password</label>
            <input id="password" name="password" type="password" required aria-invalid={issues().password ? "true" : undefined} />
            <Show when={issues().password}>{(message) => <p role="alert">{message()}</p>}</Show>
          </div>

          <button type="submit">Log in</button>
        </div>
      </form>
    </main>
  )
}
