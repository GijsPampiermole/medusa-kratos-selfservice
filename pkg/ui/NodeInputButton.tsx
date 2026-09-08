import { getNodeLabel } from "@ory/integrations/ui"
import React from "react"

import { callWebauthnFunction, NodeInputProps } from "./helpers"
import { KIcon } from "./KIcon"

export function NodeInputButton({
  node,
  attributes,
  setValue,
  disabled,
  dispatchSubmit,
}: NodeInputProps) {
  const onClick = (e: React.MouseEvent | React.FormEvent<HTMLFormElement>) => {
    if (attributes.onclick) {
      e.stopPropagation()
      e.preventDefault()
      callWebauthnFunction(attributes.onclick)
      return
    }
    setValue(attributes.value).then(() => dispatchSubmit(e))
  }

  const group = node.group as string
  const isPasskey = group === "passkey" || group === "webauthn"

  return (
    <button
      type="button"
      className="kbtn kbtn-secondary full"
      name={attributes.name}
      onClick={(e) => onClick(e)}
      value={attributes.value || ""}
      disabled={attributes.disabled || disabled}
      style={{ marginTop: 8 }}
    >
      {isPasskey && (
        <KIcon name="fingerprint" size={19} color="var(--accent-hi)" />
      )}
      {getNodeLabel(node)}
    </button>
  )
}
