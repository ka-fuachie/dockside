import { createEffect, createSignal, onSettled, Setter } from "solid-js";
import { Button } from "./ui/button";
import { MoonIcon, SunIcon } from "@lucide/solid";
import { Script } from "@solidjs/meta";
import { ComponentProps } from "@solidjs/web";

const Theme = {
  LIGHT: "light",
  DARK: "dark",
} as const

type ThemeValue = typeof Theme[keyof typeof Theme]

const THEME_STORAGE_KEY = "theme"
const DARK_THEME_QUERY = "(prefers-color-scheme: dark)"

function createTheme() {
  const [themeState, setThemeState] = createSignal({ init: true, value: Theme.LIGHT as ThemeValue })
  const theme = () => themeState().value
  const setTheme: Setter<ThemeValue> = value => {
    setThemeState(s => {
      if(typeof value === "function") return {init: false, value: value(s.value)}
      return {init: false, value}
    })
  }

  onSettled(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (storedTheme != null && (storedTheme === Theme.LIGHT || storedTheme === Theme.DARK)) {
      setTheme(storedTheme)
    } else {
      const darkThemeQuery = window.matchMedia(DARK_THEME_QUERY)
      setTheme(darkThemeQuery.matches ? Theme.DARK: Theme.LIGHT)
    }
  })

  createEffect(themeState, t => {
    if(t.init) return
    const rootEl = document.documentElement
    rootEl.classList.add("no-transitions")
    if (t.value === Theme.LIGHT) {
      rootEl.classList.remove("dark")
    } else {
      rootEl.classList.add("dark")
    }
    void rootEl.offsetHeight // Forces synchronous layout reflow
    rootEl.classList.remove("no-transitions")

    const darkThemeQuery = window.matchMedia(DARK_THEME_QUERY)
    if ((darkThemeQuery.matches && t.value !== Theme.DARK) || (!darkThemeQuery.matches && t.value !== Theme.LIGHT)) {
      localStorage.setItem(THEME_STORAGE_KEY, t.value)
      return
    }

    localStorage.removeItem(THEME_STORAGE_KEY)
    const controller = new AbortController()
    const signal = controller.signal
    darkThemeQuery.addEventListener("change", () => {
      setTheme(darkThemeQuery.matches ? Theme.DARK: Theme.LIGHT)
    }, { signal })
    return () => controller.abort()
  })

  return [theme, setTheme] as const
}

export function ThemeToggle(props: { class: ComponentProps<"button">["class"] }) {
  const [theme, setTheme] = createTheme()

  return (
    <>
      <Button
        size="icon"
        variant="tonal"
        title="Toggle theme"
        class={props.class}
        aria-pressed={theme() === Theme.DARK ? "true": "false"}
        onClick={() => setTheme(t => t === Theme.DARK? Theme.LIGHT: Theme.DARK)}
      >
        <SunIcon class="hidden dark:block" />
        <MoonIcon class="dark:hidden" />

        <span class="sr-only">Dark mode</span>
      </Button>

      <Script>
        {`(() => {
          ${Object.entries({
          Theme,
          THEME_STORAGE_KEY,
          DARK_THEME_QUERY
        }).map(([key, value]) => `let ${key} = ${JSON.stringify(value)};`).join("\n")}

          (${() => {
            const stored = localStorage.getItem(THEME_STORAGE_KEY)
            if (stored === Theme.DARK) {
              document.documentElement.classList.add("dark")
            } else if (stored === Theme.LIGHT) {
              document.documentElement.classList.remove("dark")
            } else {
              if (matchMedia(DARK_THEME_QUERY).matches) {
                document.documentElement.classList.add("dark")
              } else {
                document.documentElement.classList.remove("dark")
              }
            }
          }})()
        })()`}
      </Script>
    </>
  )
}
