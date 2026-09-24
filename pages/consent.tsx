import type { GetServerSideProps, NextPage } from "next"
import Head from "next/head"

import { acceptConsentRequest, getConsentRequest } from "../pkg/hydraAdmin"
import { AuthFooter } from "../pkg/ui/AuthFooter"
import { KChrome } from "../pkg/ui/KChrome"
import { KIcon } from "../pkg/ui/KIcon"

const SCOPE_LABELS: Record<string, { label: string; description?: string }> = {
  openid: { label: "Confirm your identity" },
  offline_access: {
    label: "Stay signed in",
    description: "Keeps you signed in without asking again",
  },
  email: { label: "Your email address" },
  profile: {
    label: "Your basic profile",
    description: "Name and other profile details",
  },
}

type Props = {
  challenge: string
  clientName: string
  requestedScope: string[]
}

const Consent: NextPage<Props> = ({ challenge, clientName, requestedScope }) => (
  <>
    <Head>
      <title>Authorize · Medusa</title>
    </Head>

    <KChrome />

    <div className="kauth">
      <div className="kcard kcard-enter">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <span
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--accent-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-hi)",
            }}
          >
            <KIcon name="shield" size={24} />
          </span>
        </div>

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
            {clientName} wants to access your account
          </h1>
          <p
            style={{
              fontSize: 13.5,
              color: "var(--fg-2)",
              margin: "8px 0 0",
              lineHeight: 1.5,
            }}
          >
            This will allow {clientName} to:
          </p>
        </div>

        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px" }}>
          {requestedScope.map((scope) => {
            const info = SCOPE_LABELS[scope] ?? { label: scope }
            return (
              <li
                key={scope}
                style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "7px 0" }}
              >
                <span style={{ color: "var(--accent-hi)", marginTop: 3, flexShrink: 0 }}>
                  <KIcon name="check" size={15} />
                </span>
                <div>
                  <div style={{ fontSize: 14, color: "var(--fg-0)", fontWeight: 500 }}>
                    {info.label}
                  </div>
                  {info.description && (
                    <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>
                      {info.description}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        <form method="POST" action="/api/consent">
          <input type="hidden" name="challenge" value={challenge} />
          {requestedScope.map((scope) => (
            <input key={scope} type="hidden" name="grant_scope" value={scope} />
          ))}

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              name="remember"
              value="true"
              defaultChecked
              style={{ width: 16, height: 16, accentColor: "var(--accent-hi)" }}
            />
            <span style={{ fontSize: 13, color: "var(--fg-2)" }}>
              Remember this decision
            </span>
          </label>

          <button
            type="submit"
            name="submit"
            value="Allow access"
            className="kbtn kbtn-primary full"
          >
            Allow access
          </button>
          <button
            type="submit"
            name="submit"
            value="Deny access"
            className="kbtn kbtn-danger full"
            style={{ marginTop: 10 }}
          >
            Deny access
          </button>
        </form>

        <AuthFooter />
      </div>
    </div>
  </>
)

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const challenge =
    typeof query.consent_challenge === "string" ? query.consent_challenge : undefined

  if (!challenge) {
    return { redirect: { destination: "/", permanent: false } }
  }

  const consentRequest = await getConsentRequest(challenge)

  if (consentRequest.skip) {
    // Already granted before (and remembered) — accept without prompting.
    const { redirect_to } = await acceptConsentRequest(challenge, {
      grant_scope: consentRequest.requested_scope,
      grant_access_token_audience: consentRequest.requested_access_token_audience,
    })
    return { redirect: { destination: redirect_to, permanent: false } }
  }

  return {
    props: {
      challenge,
      clientName: consentRequest.client.client_name || consentRequest.client.client_id,
      requestedScope: consentRequest.requested_scope,
    },
  }
}

export default Consent
