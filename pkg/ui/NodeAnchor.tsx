import { UiNode, UiNodeAnchorAttributes } from "@ory/client"

interface Props {
  node: UiNode
  attributes: UiNodeAnchorAttributes
}

export const NodeAnchor = ({ node, attributes }: Props) => (
  <button
    type="button"
    data-testid={`node/anchor/${attributes.id}`}
    className="kbtn kbtn-secondary full"
    style={{ marginTop: 8 }}
    onClick={(e) => {
      e.stopPropagation()
      e.preventDefault()
      window.location.href = attributes.href
    }}
  >
    {attributes.title.text}
  </button>
)
