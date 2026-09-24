import Link from "next/link"
import { ReactNode } from "react"

import { AuthFooter } from "./AuthFooter"
import { KChrome } from "./KChrome"
import { KIcon } from "./KIcon"

interface Props {
  /** Short headline, e.g. "Something went wrong". */
  title: string
  /** One-sentence explanation in plain language. */
  description: ReactNode
  /** Icon tone — "crit" for failures, "cool" for informational states. */
  tone?: "crit" | "cool"
  /** Optional technical detail, shown in a collapsed <details>. */
  detail?: string
  /** Primary action; omitted when there's nothing sensible to retry. */
  action?: { label: string; onClick: () => void }
  /** Secondary link target; defaults to home. */
  secondary?: { label: string; href: string }
}

/**
 * The shared failure screen: same centred card as login/register, so an error
 * doesn't drop the user out of the product's visual language.
 */
export function ErrorCard({
  title,
  description,
  tone = "crit",
  detail,
  action,
  secondary = { label: "Go back home", href: "/" },
}: Props) {
  const accent = tone === "crit" ? "var(--crit)" : "var(--cool)"
  const soft = tone === "crit" ? "var(--crit-soft)" : "var(--cool-soft)"

  return (
    <>
      <KChrome />
      <div className="kauth">
        <div className="kcard kcard-enter">
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <div
              className="kpop"
              style={{
                width: 52,
                height: 52,
                margin: "0 auto 16px",
                borderRadius: 15,
                background: soft,
                border: `0.5px solid color-mix(in srgb, ${accent} 32%, transparent)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <KIcon name={tone === "crit" ? "alert" : "info"} size={24} color={accent} />
            </div>
          </div>

          <div style={{ marginBottom: 22, textAlign: "center" }}>
            <h1
              style={{
                fontSize: 21,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: 0,
                color: "var(--fg-0)",
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--fg-2)",
                margin: "8px 0 0",
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>
          </div>

          {detail && (
            <details className="kdetails">
              <summary>Technical details</summary>
              <pre>{detail}</pre>
            </details>
          )}

          {action && (
            <button type="button" className="kbtn kbtn-primary full" onClick={action.onClick}>
              <KIcon name="refresh" size={17} color="#fff" />
              {action.label}
            </button>
          )}

          <div style={{ textAlign: "center", marginTop: action ? 18 : 4 }}>
            <Link href={secondary.href} passHref>
              <a className="klink">{secondary.label}</a>
            </Link>
          </div>

          <AuthFooter />
        </div>
      </div>
    </>
  )
}
