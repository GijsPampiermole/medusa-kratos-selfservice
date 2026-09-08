import { AxiosError } from "axios"
import type { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect } from "react"

import ory from "../pkg/sdk"

// The Ory "Welcome to Ory" managed-UI landing page (with the session
// inspector and links to every flow) now lives at /admin. Regular visitors
// land here only in transit: signed-in users go to /settings, everyone
// else goes to /login.
const Index: NextPage = () => {
  const router = useRouter()

  useEffect(() => {
    ory
      .toSession()
      .then(() => router.replace("/settings"))
      .catch((err: AxiosError) => {
        switch (err.response?.status) {
          case 403:
          case 422:
            router.replace("/login?aal=aal2")
            return
          case 401:
          default:
            router.replace("/login")
            return
        }
      })
  }, [router])

  return (
    <>
      <Head>
        <title>Medusa</title>
      </Head>
    </>
  )
}

export default Index
