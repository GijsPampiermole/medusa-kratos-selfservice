import { RecoveryFlow, UpdateRecoveryFlowBody } from "@ory/client"
import { AxiosError } from "axios"
import type { NextPage } from "next"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { Flow } from "../pkg"
import { handleFlowError } from "../pkg/errors"
import ory from "../pkg/sdk"
import { AuthFooter } from "../pkg/ui/AuthFooter"
import { KChrome } from "../pkg/ui/KChrome"
import { KIcon } from "../pkg/ui/KIcon"

const Recovery: NextPage = () => {
  const [flow, setFlow] = useState<RecoveryFlow>()

  const router = useRouter()
  const { flow: flowId, return_to: returnTo } = router.query

  useEffect(() => {
    if (!router.isReady || flow) return

    if (flowId) {
      ory
        .getRecoveryFlow({ id: String(flowId) })
        .then(({ data }) => setFlow(data))
        .catch(handleFlowError(router, "recovery", setFlow))
      return
    }

    ory
      .createBrowserRecoveryFlow({
        returnTo: String(returnTo || ""),
      })
      .then(({ data }) => setFlow(data))
      .catch(handleFlowError(router, "recovery", setFlow))
      .catch((err: AxiosError<RecoveryFlow>) => {
        if (err.response?.status === 400) {
          setFlow(err.response?.data)
          return
        }
        throw err
      })
  }, [flowId, router, router.isReady, returnTo, flow])

  const onSubmit = (values: UpdateRecoveryFlowBody) =>
    router
      .push(`/recovery?flow=${flow?.id}`, undefined, { shallow: true })
      .then(() =>
        ory
          .updateRecoveryFlow({
            flow: String(flow?.id),
            updateRecoveryFlowBody: values,
          })
          .then(({ data }) => setFlow(data))
          .catch(handleFlowError(router, "recovery", setFlow))
          .catch((err: AxiosError<RecoveryFlow>) => {
            switch (err.response?.status) {
              case 400:
                setFlow(err.response?.data)
                return
            }
            throw err
          }),
      )

  return (
    <>
      <Head>
        <title>Recover your account · Medusa</title>
        <meta name="description" content="Recover your Medusa account" />
      </Head>

      <KChrome />

      <div className="kauth">
        <div className="kcard kcard-enter">
          {/* Back link */}
          <Link href="/login" passHref>
            <a
              className="klink"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 18,
                fontSize: 13.5,
              }}
            >
              <KIcon name="arrowLeft" size={15} />
              Back
            </a>
          </Link>

          {/* Title */}
          <div style={{ marginBottom: 24 }}>
            <h1
              style={{
                fontSize: 21,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: 0,
                color: "var(--fg-0)",
              }}
            >
              Reset your password
            </h1>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--fg-2)",
                margin: "8px 0 0",
                lineHeight: 1.5,
              }}
            >
              Enter your account email and we&apos;ll send a recovery code.
            </p>
          </div>

          <Flow onSubmit={onSubmit} flow={flow} />

          <AuthFooter />
        </div>
      </div>
    </>
  )
}

export default Recovery
