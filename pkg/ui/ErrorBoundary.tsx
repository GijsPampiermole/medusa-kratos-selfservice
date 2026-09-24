import { Component, ErrorInfo, ReactNode } from "react"

import { ErrorCard } from "./ErrorCard"

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render/lifecycle errors anywhere below it so a component crash shows
 * the product's own error card instead of a blank page (or Next's dev overlay
 * in production). Recovery clears the error and re-renders the tree, which is
 * usually enough for transient failures; a full reload is the fallback.
 *
 * Note this only catches render-phase errors — it can't see rejected promises
 * from event handlers or effects, which stay the caller's responsibility.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the component stack — the message alone rarely identifies the source.
    console.error("Unhandled UI error:", error, info.componentStack)
  }

  private reset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <ErrorCard
        title="Something went wrong"
        description="This screen ran into an unexpected problem. Trying again usually clears it."
        detail={
          process.env.NODE_ENV === "production"
            ? undefined
            : `${error.name}: ${error.message}\n\n${error.stack ?? ""}`
        }
        action={{ label: "Try again", onClick: this.reset }}
      />
    )
  }
}
