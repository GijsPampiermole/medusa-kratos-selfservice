import { UiText } from "@ory/client"
import { useState } from "react"

import { KIcon } from "./KIcon"

interface MessageProps {
  message: UiText
}

const kindClass = (type: string) => {
  if (type === "error") return "kalert-error"
  if (type === "success") return "kalert-success"
  return "kalert-info"
}

const kindIcon = (type: string): { name: "alert" | "checkCircle" | "info"; color: string } => {
  if (type === "error") return { name: "alert", color: "var(--crit)" }
  if (type === "success") return { name: "checkCircle", color: "var(--accent-hi)" }
  return { name: "info", color: "var(--cool)" }
}

export const Message = ({ message }: MessageProps) => {
  // Dismissal is purely local — it hides the banner without touching the flow,
  // so the underlying server state is unchanged and reappears on the next one.
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const icon = kindIcon(message.type)

  return (
    <div
      className={`kalert ${kindClass(message.type)}`}
      data-testid={`ui/message/${message.id}`}
      role={message.type === "error" ? "alert" : "status"}
    >
      <KIcon name={icon.name} size={17} color={icon.color} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>{message.text}</div>
      <button
        type="button"
        className="ktrail"
        style={{ position: "static", width: 22, height: 22, flexShrink: 0 }}
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        <KIcon name="x" size={13} />
      </button>
    </div>
  )
}

interface MessagesProps {
  messages?: Array<UiText>
}

export const Messages = ({ messages }: MessagesProps) => {
  if (!messages) return null
  return (
    <div>
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </div>
  )
}
