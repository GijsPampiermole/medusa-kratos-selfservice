import { UiNode, UiNodeInputAttributes } from "@ory/client"

import { BrandIcon } from "./BrandIcon"

/** Display names for the providers we know; anything else is title-cased. */
const LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  apple: "Apple",
  microsoft: "Microsoft",
}

const label = (provider: string) =>
  LABELS[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1)

/**
 * The social sign-in tiles, shared by login and registration so both pages
 * stay identical. Each button submits the real Kratos oidc node, so the flow
 * behaves exactly as it would through the generic renderer.
 */
export function SsoGrid({ nodes, disabled }: { nodes: UiNode[]; disabled: boolean }) {
  if (nodes.length === 0) return null

  return (
    <div className="ksso-grid">
      {nodes.map((node, k) => {
        const attrs = node.attributes as UiNodeInputAttributes
        const provider = String(attrs.value ?? "")
        return (
          <button
            key={k}
            type="submit"
            name={attrs.name}
            value={provider}
            disabled={attrs.disabled || disabled}
            className="ksso"
          >
            <BrandIcon provider={provider} size={18} />
            {label(provider)}
          </button>
        )
      })}
    </div>
  )
}
