import {
  LoginFlow,
  UiNodeInputAttributes,
  UpdateLoginFlowBody,
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

import { LogoutLink, Messages } from "../pkg"
import { handleFlowError, handleGetFlowError } from "../pkg/errors"
import ory from "../pkg/sdk"
import { AuthFooter } from "../pkg/ui/AuthFooter"
import { KChrome } from "../pkg/ui/KChrome"
import { Node } from "../pkg/ui/Node"
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

const Login: NextPage = () => {
  const [flow, setFlow] = useState<LoginFlow>()
  const router = useRouter()
  const { return_to: returnTo, flow: flowId, refresh, aal } = router.query

  const onLogout = LogoutLink([aal, refresh])

  useEffect(() => {
    if (!router.isReady || flow) return

    if (flowId) {
      ory
        .getLoginFlow({ id: String(flowId) })
        .then(({ data }) => setFlow(data))
        .catch(handleGetFlowError(router, "login", setFlow))
      return
    }

    ory
      .createBrowserLoginFlow({
        refresh: Boolean(refresh),
        aal: aal ? String(aal) : undefined,
        returnTo: returnTo ? String(returnTo) : undefined,
      })
      .then(({ data }) => setFlow(data))
      .catch(handleFlowError(router, "login", setFlow))
  }, [flowId, router, router.isReady, aal, refresh, returnTo, flow])

  const onSubmit = (values: UpdateLoginFlowBody) =>
    router
      .push(`/login?flow=${flow?.id}`, undefined, { shallow: true })
      .then(() =>
        ory
          .updateLoginFlow({
            flow: String(flow?.id),
            updateLoginFlowBody: values,
          })
          .then(() => {
            if (flow?.return_to) {
              window.location.href = flow.return_to
              return
            }
            // Go through "/" rather than pushing "/settings" directly: "/"
            // checks the session (toSession) and only then decides where to
            // send the user, the same way the original app always did after
            // login. Pushing "/settings" directly skips that check and
            // fetches a settings flow straight away, which — if this
            // account needs a second factor — hits Kratos's own
            // redirect_browser_to handling in errors.tsx (unchanged,
            // original behavior) instead of the simple local aal2 redirect
            // "/" already does.
            router.push("/")
          })
          .catch(handleFlowError(router, "login", setFlow))
          .catch((err: AxiosError<LoginFlow>) => {
            if (err.response?.status === 400) {
              setFlow(err.response?.data)
              return
            }
            return Promise.reject(err)
          }),
      )

  // Stable per flow, mirroring the generic <Flow> component's
  // `prevProps.flow !== this.props.flow` re-initialisation contract.
  const nodes = useMemo(() => flow?.ui?.nodes ?? [], [flow])
  const { isLoading, getNodeValue, setNodeValue, handleSubmit } =
    useKratosFormState(nodes, onSubmit as any)

  // Partition nodes by group and type. The identifier field lives in the
  // "default" group on this project's Kratos schema (identifier-first),
  // so it's pulled out separately and placed next to the password field
  // rather than rendered generically with the CSRF token.
  const scriptNodes = nodes.filter((n) => isUiNodeScriptAttributes(n.attributes))
  const identifierNode = nodes.find(
    (n) => isUiNodeInputAttributes(n.attributes) && n.attributes.name === "identifier",
  )
  const hiddenDefaultNodes = nodes.filter(
    (n) =>
      n.group === "default" &&
      isUiNodeInputAttributes(n.attributes) &&
      n.attributes.type === "hidden",
  )
  const passkeyNodes = nodes.filter((n) => (n.group as string) === "passkey")
  const passwordFieldNode = nodes.find(
    (n) =>
      n.group === "password" &&
      isUiNodeInputAttributes(n.attributes) &&
      (n.attributes as UiNodeInputAttributes).type === "password",
  )
  const passwordSubmitNode = nodes.find(
    (n) =>
      n.group === "password" &&
      isUiNodeInputAttributes(n.attributes) &&
      (n.attributes as UiNodeInputAttributes).type === "submit",
  )
  const oidcNodes = nodes.filter((n) => n.group === "oidc")

  const hasPasskey = passkeyNodes.length > 0
  const hasOidc = oidcNodes.length > 0
  const hasPassword = !!passwordFieldNode

  // Any node not explicitly handled above (e.g. a second-factor code field
  // on an AAL2 login) still needs to render — this page used to rely on the
  // generic <Flow> component to render whatever the flow contained; now
  // that specific fields are pulled out by hand for layout, this fallback
  // keeps that same "render everything else" behavior for anything else.
  const handledNodes = new Set(
    [
      ...scriptNodes,
      ...hiddenDefaultNodes,
      ...passkeyNodes,
      identifierNode,
      passwordFieldNode,
      passwordSubmitNode,
      ...oidcNodes,
    ].filter(Boolean),
  )
  const fallbackNodes = nodes.filter((n) => !handledNodes.has(n))

  const title = flow?.refresh
    ? "Confirm Action"
    : flow?.requested_aal === "aal2"
    ? "Two-Factor Authentication"
    : "Sign in"

  const subtitle = flow?.refresh
    ? "Re-enter your credentials to continue."
    : flow?.requested_aal === "aal2"
    ? "Enter your second factor to continue."
    : "Welcome back. Continue to your account."

  return (
    <>
      <Head>
        <title>Sign in · Medusa</title>
        <meta name="description" content="Sign in to your Medusa account" />
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
              {title}
            </h1>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--fg-2)",
                margin: "8px 0 0",
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </p>
          </div>

          {/* Global messages */}
          {flow && <Messages messages={flow.ui.messages} />}

          {flow && (
            <form
              action={flow.ui.action}
              method={flow.ui.method}
              onSubmit={handleSubmit}
            >
              {/* WebAuthn script nodes */}
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

              {/* Hidden CSRF token */}
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

              {/* Passkey button */}
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

              {/* Divider between passkey and password */}
              {hasPasskey && hasPassword && (
                <div className="kdiv">
                  <span>or</span>
                </div>
              )}

              {/* Email + password fields */}
              {identifierNode && (
                <Node
                  node={identifierNode}
                  labelOverride="Email"
                  disabled={isLoading}
                  value={getNodeValue(identifierNode)}
                  setValue={(v) => setNodeValue(identifierNode, v)}
                  dispatchSubmit={handleSubmit}
                />
              )}
              {passwordFieldNode && (
                <Node
                  node={passwordFieldNode}
                  disabled={isLoading}
                  value={getNodeValue(passwordFieldNode)}
                  setValue={(v) => setNodeValue(passwordFieldNode, v)}
                  dispatchSubmit={handleSubmit}
                />
              )}

              {/* Forgot password link (between password field and submit) */}
              {hasPassword && !aal && !refresh && (
                <div style={{ margin: "-6px 0 20px" }}>
                  <Link href="/recovery" passHref>
                    <a className="klink">Forgot password?</a>
                  </Link>
                </div>
              )}

              {/* Password submit button */}
              {passwordSubmitNode && (
                <Node
                  node={passwordSubmitNode}
                  disabled={isLoading}
                  value={getNodeValue(passwordSubmitNode)}
                  setValue={(v) => setNodeValue(passwordSubmitNode, v)}
                  dispatchSubmit={handleSubmit}
                />
              )}

              {/* Anything else the flow returned (e.g. a second-factor
                  code field on an AAL2 login) that isn't rendered above */}
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

              {/* SSO grid */}
              {hasOidc && (
                <>
                  <div className="kdiv">
                    <span>or continue with</span>
                  </div>
                  <div className="ksso-grid">
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
                              fontSize:
                                cfg.letter.length > 1 ? 9 : 12,
                            }}
                          >
                            {cfg.letter}
                          </span>
                          {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </form>
          )}

          {/* Footer links */}
          {aal || refresh ? (
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button
                className="klink"
                onClick={onLogout}
                data-testid="logout-link"
              >
                Log out
              </button>
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                marginTop: 24,
                fontSize: 13.5,
                color: "var(--fg-2)",
              }}
            >
              Don&apos;t have an account?{" "}
              <Link href="/registration" passHref>
                <a className="klink">Sign up</a>
              </Link>
            </div>
          )}

          <AuthFooter />
        </div>
      </div>
    </>
  )
}

export default Login
