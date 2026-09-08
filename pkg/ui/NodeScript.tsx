import { UiNode, UiNodeScriptAttributes } from "@ory/client"
import { HTMLAttributeReferrerPolicy, useEffect } from "react"

interface Props {
  node: UiNode
  attributes: UiNodeScriptAttributes
}

// Ory's WebAuthn/passkey helper scripts are served by the identity server
// itself at an absolute URL. Loading that cross-origin with `crossorigin`
// set triggers a real CORS preflight, which fails unless the identity
// server's allowed-origins list happens to include this app's origin. Our
// own `/api/.ory` proxy already mirrors the identity server's paths
// same-origin (used for every other Kratos request), so route well-known
// helper scripts through it too instead of hitting the upstream directly.
function toProxiedScriptSrc(src: string): string {
  try {
    const url = new URL(src, window.location.origin)
    if (url.origin !== window.location.origin && url.pathname.startsWith("/.well-known/ory/")) {
      return `/api/.ory${url.pathname}${url.search}`
    }
    return src
  } catch {
    return src
  }
}

export const NodeScript = ({ attributes }: Props) => {
  useEffect(() => {
    const script = document.createElement("script")

    script.async = true
    script.setAttribute("data-testid", `node/script/${attributes.id}`)
    script.src = toProxiedScriptSrc(attributes.src)
    script.async = attributes.async
    script.crossOrigin = attributes.crossorigin
    script.integrity = attributes.integrity
    script.referrerPolicy =
      attributes.referrerpolicy as HTMLAttributeReferrerPolicy
    script.type = attributes.type

    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [attributes])

  return null
}
