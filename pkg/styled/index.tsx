import { ReactNode } from "react"

export const MarginCard = ({
  children,
  wide,
}: {
  children: ReactNode
  wide?: boolean
}) => <>{children}</>

export const ActionCard = ({
  children,
  wide,
}: {
  children: ReactNode
  wide?: boolean
}) => <>{children}</>

export const CenterLink = ({
  children,
  href,
  onClick,
  "data-testid": testId,
}: {
  children: ReactNode
  href?: string
  onClick?: () => void
  "data-testid"?: string
}) => (
  <a
    href={href}
    onClick={onClick}
    data-testid={testId}
    className="klink"
    style={{ display: "block", textAlign: "center", fontSize: 14 }}
  >
    {children}
  </a>
)

export interface DocsButtonProps {
  title: string
  href?: string
  onClick?: () => void
  testid: string
  disabled?: boolean
  unresponsive?: boolean
}

export const DocsButton = ({
  title,
  href,
  onClick,
  testid,
  disabled,
}: DocsButtonProps) => (
  <a href={href} data-testid={testid}>
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="kbtn kbtn-secondary"
    >
      {title}
    </button>
  </a>
)
