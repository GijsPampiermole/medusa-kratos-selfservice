import type { NextPage, NextPageContext } from "next"
import Head from "next/head"
import { useRouter } from "next/router"

import { ErrorCard } from "../pkg/ui/ErrorCard"

interface Props {
  statusCode?: number
}

/**
 * Next's catch-all error page (404s and server errors), rendered with the same
 * card as the auth screens rather than the framework default.
 */
const ErrorPage: NextPage<Props> = ({ statusCode }) => {
  const router = useRouter()
  const isNotFound = statusCode === 404

  return (
    <>
      <Head>
        <title>{isNotFound ? "Page not found · Medusa" : "Something went wrong · Medusa"}</title>
      </Head>
      <ErrorCard
        tone={isNotFound ? "cool" : "crit"}
        title={isNotFound ? "Page not found" : "Something went wrong"}
        description={
          isNotFound
            ? "That page doesn't exist, or it moved somewhere else."
            : statusCode
            ? `The server ran into a problem (error ${statusCode}).`
            : "The app ran into an unexpected problem."
        }
        action={isNotFound ? undefined : { label: "Try again", onClick: () => router.reload() }}
      />
    </>
  )
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => ({
  statusCode: res?.statusCode ?? err?.statusCode ?? 404,
})

export default ErrorPage
