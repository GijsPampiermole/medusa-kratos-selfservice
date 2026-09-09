import { SettingsFlow, UpdateSettingsFlowBody } from "@ory/client"
import { AxiosError } from "axios"
import type { NextPage } from "next"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { Flow, LogoutLink, Messages, Methods } from "../pkg"
import { handleFlowError } from "../pkg/errors"
import ory from "../pkg/sdk"
import { KChrome } from "../pkg/ui/KChrome"
import { KIcon } from "../pkg/ui/KIcon"
import {
  AuthenticatorSection,
  BackupCodesReveal,
  BackupCodesSection,
  backupCodesArePending,
  PasskeysSection,
  PasswordSection,
  ProfileSection,
  TokensSection,
} from "../pkg/ui/SettingsSections"

/* ── Inline icon set matching the reference design ─────────────── */

const IUser = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4.5 20 a7.5 7.5 0 0 1 15 0" />
  </svg>
)
const ILock = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="9" rx="2.4" /><path d="M8 11 V8 A4 4 0 0 1 16 8 V11" />
  </svg>
)
const ILink = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)
const IShield = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 L19 6 V11 C19 16 16 19.5 12 21 C8 19.5 5 16 5 11 V6 Z" /><path d="M9 12 L11.2 14.2 L15.5 9.5" />
  </svg>
)
const ISmartphone = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <rect x="7" y="3" width="10" height="18" rx="2.4" /><path d="M11 18 H13" />
  </svg>
)
const IKey = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="4.2" /><path d="M11 11 L20 20 M16.5 16.5 L19 14 M14 14 L17 17" />
  </svg>
)
const IFingerprint = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5.5 c-3.6 0-6.5 2.9-6.5 6.5 v2" /><path d="M12 8.5 c-2 0-3.5 1.6-3.5 3.5 v3.5" /><path d="M12 11.5 v4.5" /><path d="M18.5 12 c0-3.6-2.9-6.5-6.5-6.5" /><path d="M15.5 12.5 v2.5 c0 1.2-.2 2-.5 3" />
  </svg>
)

/* ── Section config ─────────────────────────────────────────────── */

const SECTIONS: Array<{
  id: Methods
  label: string
  title: string
  description: string
  Icon: () => JSX.Element
}> = [
  {
    id: "profile",
    label: "Profile",
    title: "Profile",
    description: "Update your name and email address.",
    Icon: IUser,
  },
  {
    id: "password",
    label: "Password",
    title: "Change password",
    description: "Choose a strong password. You may be asked to re-authenticate.",
    Icon: ILock,
  },
  {
    id: "oidc",
    label: "Social Sign In",
    title: "Social Sign In",
    description: "Connect social accounts for easy sign-in.",
    Icon: ILink,
  },
  {
    id: "lookup_secret",
    label: "2FA Backup Codes",
    title: "2FA Backup Codes",
    description: "One-time codes to sign in if you lose your other 2FA methods.",
    Icon: IShield,
  },
  {
    id: "totp",
    label: "Authenticator App",
    title: "Authenticator App (TOTP)",
    description: "Scan the QR code with an authenticator app to enable TOTP.",
    Icon: ISmartphone,
  },
  {
    id: "webauthn",
    label: "Hardware Tokens",
    title: "Hardware Tokens",
    description: "Manage WebAuthn security keys (e.g. YubiKey) registered to your account.",
    Icon: IKey,
  },
  {
    id: "passkey",
    label: "Passkeys",
    title: "Passkeys",
    description: "Sign in without a password using your device's biometrics.",
    Icon: IFingerprint,
  },
]

/* ── Settings section wrapper ───────────────────────────────────── */

interface SectionProps {
  flow?: SettingsFlow
  only: Methods
  title: string
  description: string
  onSubmit: (values: UpdateSettingsFlowBody) => Promise<void>
}

function SettingsSection({ flow, only, title, description, onSubmit }: SectionProps) {
  if (!flow) return null
  const hasNodes = flow.ui.nodes.some(({ group }) => group === only)
  if (!hasNodes) return null

  return (
    <div className="kset-sect">
      <div className="kset-card">
        <div style={{ marginBottom: 20 }}>
          <h2
            style={{
              fontSize: 19,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: 0,
              color: "var(--fg-0)",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: 13.5,
              color: "var(--fg-2)",
              margin: "7px 0 0",
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        </div>
        <Flow hideGlobalMessages onSubmit={onSubmit} only={only} flow={flow} />
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────── */

const Settings: NextPage = () => {
  const [flow, setFlow] = useState<SettingsFlow>()
  const [activeSection, setActiveSection] = useState<Methods>("profile")

  const router = useRouter()
  const onLogout = LogoutLink()
  const { flow: flowId, return_to: returnTo } = router.query

  useEffect(() => {
    if (!router.isReady || flow) return

    if (flowId) {
      ory
        .getSettingsFlow({ id: String(flowId) })
        .then(({ data }) => setFlow(data))
        .catch(handleFlowError(router, "settings", setFlow))
      return
    }

    ory
      .createBrowserSettingsFlow({ returnTo: String(returnTo || "") })
      .then(({ data }) => setFlow(data))
      .catch(handleFlowError(router, "settings", setFlow))
  }, [flowId, router, router.isReady, returnTo, flow])

  // Discards a not-yet-confirmed backup-codes regeneration by dropping the
  // current flow and starting a fresh one (Kratos keeps unconfirmed lookup
  // secrets attached to the flow until it is replaced).
  const onDiscardBackupCodes = () => {
    setFlow(undefined)
    router.replace("/settings", undefined, { shallow: true })
  }

  const onSubmit = (values: UpdateSettingsFlowBody) =>
    router
      .push(`/settings?flow=${flow?.id}`, undefined, { shallow: true })
      .then(() =>
        ory
          .updateSettingsFlow({
            flow: String(flow?.id),
            updateSettingsFlowBody: values,
          })
          .then(({ data }) => {
            setFlow(data)
            if (data.continue_with) {
              for (const item of data.continue_with) {
                switch (item.action) {
                  case "show_verification_ui":
                    router.push("/verification?flow=" + item.flow.id)
                    return
                }
              }
            }
            if (data.return_to) {
              window.location.href = data.return_to
            }
          })
          .catch(handleFlowError(router, "settings", setFlow))
          .catch(async (err: AxiosError<SettingsFlow>) => {
            if (err.response?.status === 400) {
              setFlow(err.response?.data)
              return
            }
            return Promise.reject(err)
          }),
      )

  const availableSections = flow
    ? SECTIONS.filter(({ id }) =>
        flow.ui.nodes.some(({ group }) => group === id),
      )
    : SECTIONS

  // A freshly regenerated (but not yet confirmed) set of backup codes
  // replaces the entire settings shell with a standalone reveal screen,
  // matching the reference design rather than embedding it in the sidebar.
  if (backupCodesArePending(flow)) {
    return (
      <>
        <Head>
          <title>Your backup codes · Medusa</title>
          <meta name="description" content="Save your Medusa backup recovery codes" />
        </Head>

        <KChrome />

        <div className="kauth">
          <div className="kcard kcard-enter">
            <BackupCodesReveal flow={flow} onSubmit={onSubmit} onDiscard={onDiscardBackupCodes} />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Settings · Medusa</title>
        <meta name="description" content="Manage your Medusa account settings" />
      </Head>

      <KChrome />

      <div className="kset">
        {/* Desktop sidebar */}
        <aside className="kset-nav">
          <div style={{ padding: "0 13px 14px" }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em" }}>
              Account
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>
              Manage your account
            </div>
          </div>

          <Link href="/" passHref>
            <a className="knav-item" style={{ marginBottom: 6, textDecoration: "none" }}>
              <span className="knav-ico">
                <KIcon name="arrowLeft" size={18} />
              </span>
              Back
            </a>
          </Link>

          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {availableSections.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`knav-item${activeSection === id ? " active" : ""}`}
                onClick={() => setActiveSection(id)}
              >
                <span className="knav-ico">
                  <Icon />
                </span>
                {label}
              </button>
            ))}
          </nav>

          <div
            style={{
              height: "0.5px",
              background: "var(--line-1)",
              margin: "14px 13px",
            }}
          />

          <button
            className="knav-item"
            onClick={onLogout}
            data-testid="logout-link"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "var(--crit)",
              padding: "10px 13px",
              borderRadius: 11,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <span className="knav-ico" style={{ color: "var(--crit)" }}>
              <KIcon name="logout" size={18} />
            </span>
            Logout
          </button>
        </aside>

        {/* Mobile pill nav */}
        <div className="kset-mobnav">
          {availableSections.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`kmob-item${activeSection === id ? " active" : ""}`}
              onClick={() => setActiveSection(id)}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="kset-main">
          <div style={{ marginBottom: 22 }}>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                margin: 0,
              }}
            >
              Account settings
            </h1>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--fg-2)",
                margin: "8px 0 0",
                lineHeight: 1.5,
              }}
            >
              Manage settings related to your account. Certain actions require
              you to re-authenticate.
            </p>
          </div>

          {flow && <Messages messages={flow.ui.messages} />}

          {SECTIONS.map(({ id, title, description }) => (
            <div
              key={id}
              className="kset-sect"
              style={{ display: activeSection === id ? "block" : "none" }}
            >
              {id === "profile" && <ProfileSection flow={flow} onSubmit={onSubmit} />}
              {id === "password" && <PasswordSection flow={flow} onSubmit={onSubmit} />}
              {id === "lookup_secret" && (
                <BackupCodesSection flow={flow} onSubmit={onSubmit} />
              )}
              {id === "totp" && <AuthenticatorSection flow={flow} onSubmit={onSubmit} />}
              {id === "webauthn" && <TokensSection flow={flow} onSubmit={onSubmit} />}
              {id === "passkey" && <PasskeysSection flow={flow} onSubmit={onSubmit} />}
              {id === "oidc" && (
                <SettingsSection
                  flow={flow}
                  only={id}
                  title={title}
                  description={description}
                  onSubmit={onSubmit}
                />
              )}
            </div>
          ))}
        </main>
      </div>
    </>
  )
}

export default Settings
