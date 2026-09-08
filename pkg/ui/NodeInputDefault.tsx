import { useState } from "react"

import { NodeInputProps, callWebauthnFunction } from "./helpers"

export function NodeInputDefault(props: NodeInputProps) {
  const { node, attributes, value = "", setValue, disabled, labelOverride } = props
  const [showPw, setShowPw] = useState(false)

  const onClick = () => {
    if (attributes.onclick) {
      callWebauthnFunction(attributes.onclick)
    }
  }

  const hasError = node.messages.find(({ type }) => type === "error")
  const isPassword = attributes.type === "password"
  const label = labelOverride ?? node.meta.label?.text

  return (
    <div className="kfield">
      {label && (
        <span className="klabel">
          {label}
          {attributes.required && <span className="req">*</span>}
        </span>
      )}
      <div className="kinput-wrap">
        <input
          className={[
            "kinput",
            isPassword ? "has-trail" : "",
            hasError ? "invalid" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          type={isPassword && showPw ? "text" : attributes.type}
          name={attributes.name}
          value={value}
          disabled={attributes.disabled || disabled}
          autoComplete={attributes.autocomplete}
          required={attributes.required}
          onClick={onClick}
          onChange={(e) => setValue(e.target.value)}
        />
        {isPassword && (
          <button
            type="button"
            className="ktrail"
            onClick={() => setShowPw((s) => !s)}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? (
              <svg
                viewBox="0 0 24 24"
                width={19}
                height={19}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M1 1l22 22" />
                <path d="M9.88 9.88a3 3 0 1 0 4.23 4.23" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                width={19}
                height={19}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      {node.messages.length > 0 && (
        <div>
          {node.messages.map(({ text, id, type }, k) => (
            <span
              key={`${id}-${k}`}
              data-testid={`ui/message/${id}`}
              className={type === "error" ? "kerror" : "khint"}
              style={{ display: "block" }}
            >
              {text}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
