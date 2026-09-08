import { UiText } from "@ory/client"

interface MessageProps {
  message: UiText
}

const kindClass = (type: string) => {
  if (type === "error") return "kalert-error"
  if (type === "success") return "kalert-success"
  return "kalert-info"
}

export const Message = ({ message }: MessageProps) => (
  <div
    className={`kalert ${kindClass(message.type)}`}
    data-testid={`ui/message/${message.id}`}
  >
    {message.text}
  </div>
)

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
