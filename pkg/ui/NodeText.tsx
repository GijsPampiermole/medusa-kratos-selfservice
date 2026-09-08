import { UiNode, UiNodeTextAttributes, UiText } from "@ory/client"

interface Props {
  node: UiNode
  attributes: UiNodeTextAttributes
}

const Content = ({ node, attributes }: Props) => {
  switch (attributes.text.id) {
    case 1050015: {
      const secrets = (attributes.text.context as any).secrets.map(
        (text: UiText, k: number) => (
          <div
            key={k}
            data-testid={`node/text/${attributes.id}/lookup_secret`}
            style={{
              padding: "8px 12px",
              background: "var(--bg-3)",
              borderRadius: 8,
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color:
                text.id === 1050014 ? "var(--fg-3)" : "var(--fg-0)",
              textDecoration:
                text.id === 1050014 ? "line-through" : "none",
            }}
          >
            {text.id === 1050014 ? "Used" : text.text}
          </div>
        ),
      )
      return (
        <div
          data-testid={`node/text/${attributes.id}/text`}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            margin: "8px 0",
          }}
        >
          {secrets}
        </div>
      )
    }
  }

  return (
    <div data-testid={`node/text/${attributes.id}/text`}>
      <div
        style={{
          background: "var(--bg-3)",
          border: "0.5px solid var(--line-2)",
          borderRadius: 10,
          padding: "12px 14px",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: "var(--fg-0)",
          letterSpacing: "0.04em",
          overflowX: "auto",
          userSelect: "all",
        }}
      >
        {attributes.text.text}
      </div>
    </div>
  )
}

export const NodeText = ({ node, attributes }: Props) => (
  <>
    {node.meta?.label?.text && (
      <p
        data-testid={`node/text/${attributes.id}/label`}
        style={{
          fontSize: 13,
          color: "var(--fg-2)",
          marginBottom: 8,
          marginTop: 0,
        }}
      >
        {node.meta.label.text}
      </p>
    )}
    <Content node={node} attributes={attributes} />
  </>
)
