import {
  UiNodeInputAttributes,
  UpdateVerificationFlowBody,
  VerificationFlow,
} from "@ory/client"
import { isUiNodeInputAttributes } from "@ory/integrations/ui"
import { AxiosError } from "axios"
import type { NextPage } from "next"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"

import ory from "../pkg/sdk"
import { AuthFooter } from "../pkg/ui/AuthFooter"
import { KChrome } from "../pkg/ui/KChrome"
import { KIcon } from "../pkg/ui/KIcon"
import { Messages } from "../pkg/ui/Messages"
import { Node } from "../pkg/ui/Node"
import { OtpInput } from "../pkg/ui/OtpInput"
import { useKratosFormState } from "../pkg/ui/useKratosFormState"

const Verification: NextPage = () => {
  const [flow, setFlow] = useState<VerificationFlow>()
  const [otpValue, setOtpValue] = useState("")

  const router = useRouter()
  const { flow: flowId, return_to: returnTo } = router.query

  useEffect(() => {
    if (!router.isReady || flow) return

    if (flowId) {
      ory
        .getVerificationFlow({ id: String(flowId) })
        .then(({ data }) => setFlow(data))
        .catch((err: AxiosError) => {
          switch (err.response?.status) {
            case 410:
            case 403:
              return router.push("/verification")
          }
          throw err
        })
      return
    }

    ory
      .createBrowserVerificationFlow({
        returnTo: returnTo ? String(returnTo) : undefined,
      })
      .then(({ data }) => setFlow(data))
      .catch((err: AxiosError) => {
        switch (err.response?.status) {
          case 400:
            return router.push("/")
        }
        throw err
      })
  }, [flowId, router, router.isReady, returnTo, flow])

  const onSubmit = async (values: UpdateVerificationFlowBody) => {
    await router.push(`/verification?flow=${flow?.id}`, undefined, {
      shallow: true,
    })

    ory
      .updateVerificationFlow({
        flow: String(flow?.id),
        updateVerificationFlowBody: values,
      })
      .then(({ data }) => {
        setFlow(data)
        setOtpValue("")
      })
      .catch((err: AxiosError<VerificationFlow & { use_flow_id?: string }>) => {
        switch (err.response?.status) {
          case 400:
            setFlow(err.response?.data)
            return
          case 410: {
            const newFlowID = String(err.response.data.use_flow_id)
            router.push(`/verification?flow=${newFlowID}`, undefined, {
              shallow: true,
            })
            ory
              .getVerificationFlow({ id: newFlowID })
              .then(({ data }) => setFlow(data))
            return
          }
        }
        throw err
      })
  }

  // Stable per flow, mirroring the generic <Flow> component's
  // `prevProps.flow !== this.props.flow` re-initialisation contract.
  const nodes = useMemo(() => flow?.ui?.nodes ?? [], [flow])
  const { isLoading, getNodeValue, setNodeValue, handleSubmit } =
    useKratosFormState(nodes, onSubmit as any)

  const defaultNodes = nodes.filter((n) => n.group === "default")
  const codeNode = nodes.find(
    (n) =>
      isUiNodeInputAttributes(n.attributes) &&
      (n.attributes as UiNodeInputAttributes).name === "code",
  )
  const emailNode = nodes.find(
    (n) =>
      isUiNodeInputAttributes(n.attributes) &&
      ((n.attributes as UiNodeInputAttributes).name === "email" ||
        (n.attributes as UiNodeInputAttributes).type === "email"),
  )
  const submitNode = nodes.find(
    (n) =>
      isUiNodeInputAttributes(n.attributes) &&
      (n.attributes as UiNodeInputAttributes).type === "submit",
  )

  // If code node exists, show OTP boxes; otherwise show email input
  const isCodeStage = !!codeNode
  const email = flow?.ui?.messages?.find((m) => m.id === 1080001)?.text ?? ""

  // Every node the flow returned still has to render and submit, exactly as
  // the generic <Flow> renderer did — the fields above are only placed by
  // hand for layout. Anything not placed above lands here.
  const handledNodes = new Set(
    [...defaultNodes, codeNode, emailNode, submitNode].filter(Boolean),
  )
  const fallbackNodes = nodes.filter((n) => !handledNodes.has(n))

  return (
    <>
      <Head>
        <title>Verify your account · Medusa</title>
        <meta name="description" content="Verify your Medusa account" />
      </Head>

      <KChrome />

      <div className="kauth">
        <div className="kcard kcard-enter">
          {/* Mail icon */}
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <div
              style={{
                width: 52,
                height: 52,
                margin: "0 auto 16px",
                borderRadius: 15,
                background: "var(--bg-3)",
                border: "0.5px solid var(--line-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <KIcon name="mail" size={24} color="var(--accent-hi)" />
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 20, textAlign: "center" }}>
            <h1
              style={{
                fontSize: 21,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: 0,
                color: "var(--fg-0)",
              }}
            >
              Verify your email
            </h1>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--fg-2)",
                margin: "8px 0 0",
                lineHeight: 1.5,
              }}
            >
              {email
                ? <>Enter the 6-digit code we sent to <strong style={{ color: "var(--fg-1)" }}>{email}</strong>.</>
                : "Enter the 6-digit code we sent to your email."}
            </p>
          </div>

          {flow && <Messages messages={flow.ui.messages} />}

          {flow && (
            <form
              action={flow.ui.action}
              method={flow.ui.method}
              onSubmit={handleSubmit}
            >
              {/* Hidden CSRF */}
              {defaultNodes.map((node, k) => (
                <Node
                  key={`default-${k}`}
                  node={node}
                  disabled={isLoading}
                  value={getNodeValue(node)}
                  setValue={(v) => setNodeValue(node, v)}
                  dispatchSubmit={handleSubmit}
                />
              ))}

              {/* Email field (first stage) or OTP boxes (code stage) */}
              {isCodeStage ? (
                <>
                  {/* Hidden real code input */}
                  <input
                    type="hidden"
                    name="code"
                    value={otpValue}
                    onChange={() => {}}
                  />
                  {/* Visual OTP boxes */}
                  <div style={{ margin: "8px 0 22px" }}>
                    <OtpInput
                      value={otpValue}
                      onChange={(v) => {
                        setOtpValue(v)
                        setNodeValue(codeNode!, v)
                      }}
                    />
                  </div>
                </>
              ) : (
                emailNode && (
                  <Node
                    node={emailNode}
                    disabled={isLoading}
                    value={getNodeValue(emailNode)}
                    setValue={(v) => setNodeValue(emailNode, v)}
                    dispatchSubmit={handleSubmit}
                  />
                )
              )}

              {/* Submit button */}
              {submitNode && (
                <Node
                  node={submitNode}
                  disabled={isLoading || (isCodeStage && otpValue.length < 6)}
                  value={getNodeValue(submitNode)}
                  setValue={(v) => setNodeValue(submitNode, v)}
                  dispatchSubmit={handleSubmit}
                />
              )}

              {/* Anything the flow returned that isn't placed above */}
              {fallbackNodes.map((node, k) => (
                <Node
                  key={`fallback-${k}`}
                  node={node}
                  disabled={isLoading}
                  value={getNodeValue(node)}
                  setValue={(v) => setNodeValue(node, v)}
                  dispatchSubmit={handleSubmit}
                />
              ))}
            </form>
          )}

          {/* Resend / back links */}
          <div
            style={{
              textAlign: "center",
              marginTop: 18,
              fontSize: 13,
              color: "var(--fg-2)",
            }}
          >
            Didn&apos;t receive it?{" "}
            <button
              className="klink"
              onClick={() => {
                setOtpValue("")
                router.push("/verification")
              }}
            >
              Resend code
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <Link href="/login" passHref>
              <a className="klink" style={{ color: "var(--fg-3)" }}>
                Use a different account
              </a>
            </Link>
          </div>

          <AuthFooter />
        </div>
      </div>
    </>
  )
}

export default Verification
