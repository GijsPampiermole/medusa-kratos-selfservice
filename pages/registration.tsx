import {
  RegistrationFlow,
  UiNodeInputAttributes,
  UpdateRegistrationFlowBody,
} from "@ory/client"
import {
  isUiNodeInputAttributes,
  isUiNodeScriptAttributes,
} from "@ory/integrations/ui"
import { AxiosError } from "axios"
import type { NextPage } from "next"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"

import { Messages } from "../pkg"
import { handleFlowError } from "../pkg/errors"
import ory from "../pkg/sdk"
import { AuthFooter } from "../pkg/ui/AuthFooter"
import { KChrome } from "../pkg/ui/KChrome"
import { KIcon } from "../pkg/ui/KIcon"
import { Node } from "../pkg/ui/Node"
import { StrengthMeter } from "../pkg/ui/StrengthMeter"
import { useKratosFormState } from "../pkg/ui/useKratosFormState"

const SSO_CONFIG: Record<
  string,
  { label: string; letter: string; bg: string }
> = {
  google: { label: "Google", letter: "G", bg: "#4285F4" },
  github: { label: "GitHub", letter: "GH", bg: "#1a1d19" },
  apple: { label: "Apple", letter: "A", bg: "#111" },
  microsoft: { label: "Microsoft", letter: "M", bg: "#2F7CC2" },
}

const Registration: NextPage = () => {
  const router = useRouter()
  const [flow, setFlow] = useState<RegistrationFlow>()
  const { flow: flowId, return_to: returnTo } = router.query

  useEffect(() => {
    if (!router.isReady || flow) return

    if (flowId) {
      ory
        .getRegistrationFlow({ id: String(flowId) })
        .then(({ data }) => setFlow(data))
        .catch(handleFlowError(router, "registration", setFlow))
      return
    }

    ory
      .createBrowserRegistrationFlow({
        returnTo: returnTo ? String(returnTo) : undefined,
      })
      .then(({ data }) => setFlow(data))
      .catch(handleFlowError(router, "registration", setFlow))
  }, [flowId, router, router.isReady, returnTo, flow])

  const onSubmit = async (values: UpdateRegistrationFlowBody) => {
    await router.push(`/registration?flow=${flow?.id}`, undefined, {
      shallow: true,
    })

    ory
      .updateRegistrationFlow({
        flow: String(flow?.id),
        updateRegistrationFlowBody: values,
      })
      .then(async ({ data }) => {
        if (data.continue_with) {
          for (const item of data.continue_with) {
            switch (item.action) {
              case "show_verification_ui":
                await router.push("/verification?flow=" + item.flow.id)
                return
            }
          }
        }
        await router.push(flow?.return_to || "/")
      })
      .catch(handleFlowError(router, "registration", setFlow))
      .catch((err: AxiosError<RegistrationFlow>) => {
        if (err.response?.status === 400) {
          setFlow(err.response?.data)
          return
        }
        return Promise.reject(err)
      })
  }

  // Stable per flow, mirroring the generic <Flow> component's
  // `prevProps.flow !== this.props.flow` re-initialisation contract.
  const nodes = useMemo(() => flow?.ui?.nodes ?? [], [flow])
  const { isLoading, getNodeValue, setNodeValue, handleSubmit } =
    useKratosFormState(nodes, onSubmit as any)

  const scriptNodes = nodes.filter((n) => isUiNodeScriptAttributes(n.attributes))
  const hiddenDefaultNodes = nodes.filter(
    (n) =>
      n.group === "default" &&
      isUiNodeInputAttributes(n.attributes) &&
      (n.attributes as UiNodeInputAttributes).type === "hidden",
  )
  const oidcNodes = nodes.filter((n) => n.group === "oidc")

  // Trait/credential fields can live in different groups depending on the
  // Kratos schema (e.g. "default" for identifier-first, "password" for a
  // classic single-step form) — so match by name/type across all of them
  // rather than assuming one group.
  const fieldNodes = nodes.filter((n) => {
    if (!isUiNodeInputAttributes(n.attributes)) return false
    const attrs = n.attributes as UiNodeInputAttributes
    if (attrs.type === "hidden" || attrs.type === "submit" || attrs.type === "button") {
      return false
    }
    const group = n.group as string
    return group !== "oidc" && group !== "passkey" && group !== "webauthn"
  })
  const passwordSubmitNode = nodes.find((n) => {
    if (!isUiNodeInputAttributes(n.attributes)) return false
    const attrs = n.attributes as UiNodeInputAttributes
    const group = n.group as string
    return attrs.type === "submit" && group !== "oidc" && group !== "passkey" && group !== "webauthn"
  })

  // Detect name fields for 2-col layout
  const isNameField = (node: (typeof nodes)[0]) => {
    if (!isUiNodeInputAttributes(node.attributes)) return false
    const name = (node.attributes as UiNodeInputAttributes).name
    return (
      name.includes("name.first") ||
      name.includes("name.last") ||
      name.includes("first_name") ||
      name.includes("last_name") ||
      name === "traits.name"
    )
  }

  const isPasswordField = (node: (typeof nodes)[0]) => {
    if (!isUiNodeInputAttributes(node.attributes)) return false
    return (node.attributes as UiNodeInputAttributes).type === "password"
  }

  const emailNode = fieldNodes.find((n) => {
    if (!isUiNodeInputAttributes(n.attributes)) return false
    const attrs = n.attributes as UiNodeInputAttributes
    return attrs.type === "email" || attrs.name.includes("email")
  })

  const nameNodes = fieldNodes.filter(
    (n) => isNameField(n) && n !== emailNode,
  )
  const passwordFieldNode = fieldNodes.find(isPasswordField)
  const otherInputNodes = fieldNodes.filter(
    (n) =>
      n !== emailNode &&
      !isNameField(n) &&
      !isPasswordField(n),
  )

  const hasOidc = oidcNodes.length > 0
  const pwValue = passwordFieldNode ? String(getNodeValue(passwordFieldNode) ?? "") : ""

  const passkeyNodes = nodes.filter((n) => (n.group as string) === "passkey")
  const hasPasskey = passkeyNodes.length > 0

  // Every node the flow returned still has to render and submit, exactly as
  // the generic <Flow> renderer did — the sections above only choose where
  // the known fields are placed. Anything not placed by hand lands here.
  const handledNodes = new Set(
    [
      ...scriptNodes,
      ...hiddenDefaultNodes,
      ...oidcNodes,
      ...passkeyNodes,
      ...fieldNodes,
      passwordSubmitNode,
    ].filter(Boolean),
  )
  const fallbackNodes = nodes.filter((n) => !handledNodes.has(n))

  return (
    <>
      <Head>
        <title>Create account · Medusa</title>
        <meta name="description" content="Create your Medusa account" />
      </Head>

      <KChrome />

      <div className="kauth">
        <div className="kcard kcard-enter">
          {/* Title */}
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <h1
              style={{
                fontSize: 21,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: 0,
                color: "var(--fg-0)",
              }}
            >
              Register an account
            </h1>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--fg-2)",
                margin: "8px 0 0",
                lineHeight: 1.5,
              }}
            >
              Create your account to get started.
            </p>
          </div>

          {flow && <Messages messages={flow.ui.messages} />}

          {flow && (
            <form
              action={flow.ui.action}
              method={flow.ui.method}
              onSubmit={handleSubmit}
            >
              {/* Script nodes */}
              {scriptNodes.map((node, k) => (
                <Node
                  key={`script-${k}`}
                  node={node}
                  disabled={isLoading}
                  value={getNodeValue(node)}
                  setValue={(v) => setNodeValue(node, v)}
                  dispatchSubmit={handleSubmit}
                />
              ))}

              {/* Hidden CSRF (+ traits carried over from the first screen) */}
              {hiddenDefaultNodes.map((node, k) => (
                <Node
                  key={`default-${k}`}
                  node={node}
                  disabled={isLoading}
                  value={getNodeValue(node)}
                  setValue={(v) => setNodeValue(node, v)}
                  dispatchSubmit={handleSubmit}
                />
              ))}

              {/* SSO grid */}
              {hasOidc && (
                <>
                  <div className="ksso-grid" style={{ marginBottom: 0 }}>
                    {oidcNodes.map((node, k) => {
                      const attrs = node.attributes as UiNodeInputAttributes
                      const provider = String(attrs.value ?? "")
                      const cfg = SSO_CONFIG[provider] ?? {
                        label: provider,
                        letter: provider.slice(0, 2).toUpperCase(),
                        bg: "var(--bg-4)",
                      }
                      return (
                        <button
                          key={k}
                          type="submit"
                          name={attrs.name}
                          value={String(attrs.value ?? "")}
                          disabled={attrs.disabled || isLoading}
                          className="ksso"
                        >
                          <span
                            className="ksso-badge"
                            style={{
                              background: cfg.bg,
                              fontSize: cfg.letter.length > 1 ? 9 : 12,
                            }}
                          >
                            {cfg.letter}
                          </span>
                          {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="kdiv">
                    <span>or sign up with email</span>
                  </div>
                </>
              )}

              {/* Passkey */}
              {hasPasskey &&
                passkeyNodes.map((node, k) => (
                  <Node
                    key={`passkey-${k}`}
                    node={node}
                    disabled={isLoading}
                    value={getNodeValue(node)}
                    setValue={(v) => setNodeValue(node, v)}
                    dispatchSubmit={handleSubmit}
                  />
                ))}

              {hasPasskey && passwordFieldNode && (
                <div className="kdiv">
                  <span>or</span>
                </div>
              )}

              {emailNode && (
                <Node
                  node={emailNode}
                  labelOverride="Email"
                  disabled={isLoading}
                  value={getNodeValue(emailNode)}
                  setValue={(v) => setNodeValue(emailNode, v)}
                  dispatchSubmit={handleSubmit}
                />
              )}

              {/* First / Last name in 2-col if exactly 2 name fields */}
              {nameNodes.length === 2 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  {nameNodes.map((node, k) => (
                    <Node
                      key={`name-${k}`}
                      node={node}
                      disabled={isLoading}
                      value={getNodeValue(node)}
                      setValue={(v) => setNodeValue(node, v)}
                      dispatchSubmit={handleSubmit}
                    />
                  ))}
                </div>
              ) : (
                nameNodes.map((node, k) => (
                  <Node
                    key={`name-${k}`}
                    node={node}
                    disabled={isLoading}
                    value={getNodeValue(node)}
                    setValue={(v) => setNodeValue(node, v)}
                    dispatchSubmit={handleSubmit}
                  />
                ))
              )}

              {otherInputNodes.map((node, k) => (
                <Node
                  key={`other-${k}`}
                  node={node}
                  disabled={isLoading}
                  value={getNodeValue(node)}
                  setValue={(v) => setNodeValue(node, v)}
                  dispatchSubmit={handleSubmit}
                />
              ))}

              {passwordFieldNode && (
                <>
                  <Node
                    node={passwordFieldNode}
                    disabled={isLoading}
                    value={getNodeValue(passwordFieldNode)}
                    setValue={(v) => setNodeValue(passwordFieldNode, v)}
                    dispatchSubmit={handleSubmit}
                  />
                  <StrengthMeter value={pwValue} />
                </>
              )}

              {/* Submit button */}
              {passwordSubmitNode && (
                <div style={{ marginTop: 22 }}>
                  <Node
                    node={passwordSubmitNode}
                    disabled={isLoading}
                    value={getNodeValue(passwordSubmitNode)}
                    setValue={(v) => setNodeValue(passwordSubmitNode, v)}
                    dispatchSubmit={handleSubmit}
                  />
                </div>
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

          <div
            style={{
              textAlign: "center",
              marginTop: 22,
              fontSize: 13.5,
              color: "var(--fg-2)",
            }}
          >
            Already have an account?{" "}
            <Link href="/login" passHref>
              <a data-testid="cta-link" className="klink">
                Sign in
              </a>
            </Link>
          </div>

          <AuthFooter />
        </div>
      </div>
    </>
  )
}

export default Registration
