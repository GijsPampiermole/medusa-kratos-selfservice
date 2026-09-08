import { useEffect, useState } from "react"
import { KIcon } from "./KIcon"

export function KChrome() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const stored = localStorage.getItem("kratos_theme") as "dark" | "light" | null
    const t = stored ?? "dark"
    setTheme(t)
    document.documentElement.setAttribute("data-theme", t)
  }, [])

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    document.documentElement.setAttribute("data-theme", next)
    try { localStorage.setItem("kratos_theme", next) } catch {}
  }

  return (
    <div className="kchrome">
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          cursor: "pointer",
          background: "var(--bg-2)",
          border: "0.5px solid var(--line-2)",
          color: "var(--fg-1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <KIcon name={theme === "light" ? "moon" : "sun"} size={18} />
      </button>
    </div>
  )
}
