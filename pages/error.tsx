import { FlowError } from "@ory/client"
import { AxiosError } from "axios"
import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import ory from "../pkg/sdk"
import { ErrorCard } from "../pkg/ui/ErrorCard"

const Error: NextPage = () => {
  const [error, setError] = useState<FlowError | string>()

  // Get ?id=... from the URL
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    // If the router is not ready yet, or we already have an error, do nothing.
    if (!router.isReady || error) {
      return
    }

    ory
      .getFlowError({ id: String(id) })
      .then(({ data }) => {
        setError(data)
      })
      .catch((err: AxiosError) => {
        switch (err.response?.status) {
          case 404:
          // The error id could not be found. Let's just redirect home!
          case 403:
          // The error id could not be fetched due to e.g. a CSRF issue. Let's just redirect home!
          case 410:
            // The error id expired. Let's just redirect home!
            return router.push("/")
        }

        return Promise.reject(err)
      })
  }, [id, router, router.isReady, error])

  if (!error) {
    return null
  }

  // Kratos nests the human-readable text under error.reason/message; fall back
  // to the raw payload when it's shaped differently.
  const payload = typeof error === "string" ? undefined : (error as any)?.error
  const message: string =
    payload?.reason || payload?.message || "The identity server reported an error."

  return (
    <>
      <Head>
        <title>An error occurred · Medusa</title>
      </Head>
      <ErrorCard
        title="An error occurred"
        description={message}
        detail={JSON.stringify(error, null, 2)}
      />
    </>
  )
}

export default Error
