import "../styles/globals.css"
import type { AppProps } from "next/app"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import { ErrorBoundary } from "../pkg/ui/ErrorBoundary"

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div
      data-testid="app-react"
      style={{ flex: 1, display: "flex", flexDirection: "column" }}
    >
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
      <ToastContainer />
    </div>
  )
}

export default MyApp
