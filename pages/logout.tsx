import type { GetServerSideProps, NextPage } from "next"
import Head from "next/head"

import { getLogoutRequest } from "../pkg/hydraAdmin"
import { AuthFooter } from "../pkg/ui/AuthFooter"
import { KChrome } from "../pkg/ui/KChrome"
import { KIcon } from "../pkg/ui/KIcon"

type Props = { challenge: string }

// Confirms Hydra's RP-initiated (end-session) logout — a different flow
// from the app's own Kratos-driven "Logout" button in settings.tsx.
const Logout: NextPage<Props> = ({ challenge }) => (
  <>
    <Head>
      <title>Sign out · Medusa</title>
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
              background: "var(--crit-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--crit)",
            }}
          >
            <KIcon name="logout" size={22} />
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
            Sign out?
          </h1>
          <p
            style={{
              fontSize: 13.5,
              color: "var(--fg-2)",
              margin: "8px 0 0",
              lineHeight: 1.5,
            }}
          >
            You&apos;ll need to sign in again to continue.
          </p>
        </div>

        <form method="POST" action="/api/logout">
          <input type="hidden" name="challenge" value={challenge} />
          <button
            type="submit"
            name="submit"
            value="Yes"
            className="kbtn kbtn-danger full"
          >
            Sign out
          </button>
          <button
            type="submit"
            name="submit"
            value="No"
            className="kbtn kbtn-secondary full"
            style={{ marginTop: 10 }}
          >
            Cancel
          </button>
        </form>

        <AuthFooter />
      </div>
    </div>
  </>
)

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const challenge =
    typeof query.logout_challenge === "string" ? query.logout_challenge : undefined

  if (!challenge) {
    return { redirect: { destination: "/", permanent: false } }
  }

  // Validates the challenge is real before showing the confirmation UI.
  await getLogoutRequest(challenge)

  return { props: { challenge } }
}

export default Logout
