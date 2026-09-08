import { getNodeLabel } from "@ory/integrations/ui"

import { NodeInputProps } from "./helpers"

export function NodeInputSubmit({ node, attributes, disabled, labelOverride }: NodeInputProps) {
  const group = node.group as string
  const isSecondary =
    group === "oidc" ||
    group === "passkey" ||
    group === "webauthn"

  return (
    <button
      type="submit"
      className={`kbtn kbtn-${isSecondary ? "secondary" : "primary"} full`}
      name={attributes.name}
      value={attributes.value || ""}
      disabled={attributes.disabled || disabled}
      style={{ marginTop: 8 }}
    >
      {labelOverride ?? getNodeLabel(node)}
    </button>
  )
}
