import { getNodeLabel } from "@ory/integrations/ui"

import { NodeInputProps } from "./helpers"

export function NodeInputCheckbox({
  node,
  attributes,
  setValue,
  disabled,
}: NodeInputProps) {
  const hasError = node.messages.find(({ type }) => type === "error")

  return (
    <div className="kfield">
      <label
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
      >
        <input
          type="checkbox"
          name={attributes.name}
          defaultChecked={attributes.value}
          onChange={(e) => setValue(e.target.checked)}
          disabled={attributes.disabled || disabled}
          style={{
            width: 18,
            height: 18,
            accentColor: "var(--accent-hi)",
            cursor: "pointer",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 14, color: "var(--fg-1)", lineHeight: 1.4 }}>
          {getNodeLabel(node)}
        </span>
      </label>
      {hasError &&
        node.messages.map(({ text, id }) => (
          <span
            key={id}
            data-testid={`ui/message/${id}`}
            className="kerror"
            style={{ display: "block" }}
          >
            {text}
          </span>
        ))}
    </div>
  )
}
