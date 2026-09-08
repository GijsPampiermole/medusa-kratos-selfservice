import {
  SettingsFlow,
  UiNode,
  UiNodeImageAttributes,
  UiNodeInputAttributes,
  UiNodeTextAttributes,
  UpdateSettingsFlowBody,
} from "@ory/client"
import {
  isUiNodeImageAttributes,
  isUiNodeInputAttributes,
  isUiNodeScriptAttributes,
  isUiNodeTextAttributes,
} from "@ory/integrations/ui"
import { ReactNode, useEffect, useMemo, useRef, useState } from "react"

import { Node } from "./Node"
import { callWebauthnFunction } from "./helpers"
import { KIcon } from "./KIcon"
import { StrengthMeter } from "./StrengthMeter"
import { useKratosFormState } from "./useKratosFormState"

type OnSubmit = (values: UpdateSettingsFlowBody) => Promise<void>

function nodesForGroup(flow: SettingsFlow | undefined, group: string): UiNode[] {
  if (!flow) return []
  return flow.ui.nodes.filter((n) => n.group === "default" || n.group === group)
}

function findInput(nodes: UiNode[], name: string) {
  return nodes.find(
    (n) => isUiNodeInputAttributes(n.attributes) && n.attributes.name === name,
  )
}

function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
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
        {sub}
      </p>
    </div>
  )
}

function CredentialRow({
  icon,
  name,
  meta,
  removeNode,
  disabled,
}: {
  icon: "key" | "fingerprint"
  name: string
  meta: string
  removeNode?: UiNode
  disabled: boolean
}) {
  const attrs = removeNode?.attributes as UiNodeInputAttributes | undefined
  return (
    <div
      className="krow"
      style={{
        padding: "13px 15px",
        borderRadius: 12,
        background: "var(--bg-1)",
        border: "0.5px solid var(--line-2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            flexShrink: 0,
            background: "var(--bg-3)",
            border: "0.5px solid var(--line-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <KIcon name={icon} size={18} color="var(--accent-hi)" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 1 }}>
            {meta}
          </div>
        </div>
      </div>
      {attrs && (
        <button
          type="submit"
          name={attrs.name}
          value={String(attrs.value ?? "")}
          disabled={attrs.disabled || disabled}
          className="ktrail"
          style={{ position: "static", width: 34, height: 34 }}
          aria-label="Remove"
        >
          <KIcon name="trash" size={16} color="var(--fg-3)" />
        </button>
      )}
    </div>
  )
}

function credentialMeta(node: UiNode) {
  const label = node.meta.label as any
  const ctx = label?.context ?? {}
  const displayName: string = ctx.display_name || label?.text || "Security key"
  const addedAt: string | undefined = ctx.added_at
  let meta = "Registered"
  if (addedAt && !addedAt.startsWith("0001")) {
    const d = new Date(addedAt)
    if (!isNaN(d.getTime())) {
      meta = `Added ${d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}`
    }
  }
  return { displayName, meta }
}

/* ── Save button: spinner while submitting, checkmark once saved ─ */
// Mirrors the reference design's SaveButton (idle → saving → saved → idle)
// instead of the flow-level "Your changes have been saved!" message, which
// never dismisses itself.

function Spinner({ size = 17, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <span className="kspin" style={{ width: size, height: size, display: "inline-flex", flexShrink: 0 }}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2.4} style={{ opacity: 0.3 }} />
        <path d="M12 3 A9 9 0 0 1 21 12" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      </svg>
    </span>
  )
}

function useJustSaved(isLoading: boolean, hasError: boolean) {
  const [justSaved, setJustSaved] = useState(false)
  const wasLoading = useRef(false)
  useEffect(() => {
    const was = wasLoading.current
    wasLoading.current = isLoading
    if (was && !isLoading && !hasError) {
      setJustSaved(true)
      const t = setTimeout(() => setJustSaved(false), 1700)
      return () => clearTimeout(t)
    }
  }, [isLoading, hasError])
  return justSaved
}

function SaveButton({
  node,
  label,
  isLoading,
  justSaved,
  disabled,
  icon,
}: {
  node: UiNode
  label: string
  isLoading: boolean
  justSaved: boolean
  disabled?: boolean
  icon?: ReactNode
}) {
  const attrs = node.attributes as UiNodeInputAttributes
  return (
    <button
      type="submit"
      name={attrs.name}
      value={String(attrs.value ?? "")}
      disabled={attrs.disabled || disabled || isLoading}
      className={`kbtn kbtn-${justSaved ? "secondary" : "primary"} full`}
      style={{ marginTop: 8 }}
    >
      {isLoading ? (
        <Spinner size={17} color="#fff" />
      ) : justSaved ? (
        <KIcon name="check" size={17} color="var(--accent-hi)" />
      ) : (
        icon
      )}
      {justSaved && !isLoading ? "Saved" : label}
    </button>
  )
}

/* ── Profile ──────────────────────────────────────────────────── */

export function ProfileSection({ flow, onSubmit }: { flow?: SettingsFlow; onSubmit: OnSubmit }) {
  const nodes = useMemo(() => nodesForGroup(flow, "profile"), [flow])
  const { isLoading, getNodeValue, setNodeValue, handleSubmit } = useKratosFormState(
    nodes,
    onSubmit as any,
  )
  const justSaved = useJustSaved(isLoading, nodes.some((n) => n.messages.some((m) => m.type === "error")))

  if (!flow || nodes.length === 0) return null

  const defaultNodes = nodes.filter((n) => n.group === "default")
  const submitNode = nodes.find(
    (n) => isUiNodeInputAttributes(n.attributes) && n.attributes.type === "submit",
  )
  const emailNode = nodes.find(
    (n) =>
      isUiNodeInputAttributes(n.attributes) &&
      (n.attributes.type === "email" || n.attributes.name.includes("email")),
  )
  const isNameField = (n: UiNode) =>
    isUiNodeInputAttributes(n.attributes) &&
    (n.attributes.name.includes("name.first") ||
      n.attributes.name.includes("name.last") ||
      n.attributes.name.includes("first_name") ||
      n.attributes.name.includes("last_name"))
  const firstNode = nodes.find(
    (n) => isNameField(n) && (n.attributes as UiNodeInputAttributes).name.match(/first/i),
  )
  const lastNode = nodes.find(
    (n) => isNameField(n) && (n.attributes as UiNodeInputAttributes).name.match(/last/i),
  )
  const otherNodes = nodes.filter(
    (n) =>
      isUiNodeInputAttributes(n.attributes) &&
      n.attributes.type !== "submit" &&
      n !== emailNode &&
      n !== firstNode &&
      n !== lastNode,
  )

  return (
    <form action={flow.ui.action} method={flow.ui.method} onSubmit={handleSubmit}>
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
      <div className="kset-card">
        <SectionHead title="Profile" sub="Update your personal details and contact email." />
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
        {(firstNode || lastNode) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {firstNode && (
              <Node
                node={firstNode}
                labelOverride="First name"
                disabled={isLoading}
                value={getNodeValue(firstNode)}
                setValue={(v) => setNodeValue(firstNode, v)}
                dispatchSubmit={handleSubmit}
              />
            )}
            {lastNode && (
              <Node
                node={lastNode}
                labelOverride="Last name"
                disabled={isLoading}
                value={getNodeValue(lastNode)}
                setValue={(v) => setNodeValue(lastNode, v)}
                dispatchSubmit={handleSubmit}
              />
            )}
          </div>
        )}
        {otherNodes.map((node, k) => (
          <Node
            key={`other-${k}`}
            node={node}
            disabled={isLoading}
            value={getNodeValue(node)}
            setValue={(v) => setNodeValue(node, v)}
            dispatchSubmit={handleSubmit}
          />
        ))}
        <div style={{ marginTop: 6 }}>
          {submitNode && (
            <SaveButton node={submitNode} label="Save" isLoading={isLoading} justSaved={justSaved} />
          )}
        </div>
      </div>
    </form>
  )
}

/* ── Password ─────────────────────────────────────────────────── */

export function PasswordSection({ flow, onSubmit }: { flow?: SettingsFlow; onSubmit: OnSubmit }) {
  const nodes = useMemo(() => nodesForGroup(flow, "password"), [flow])
  const { isLoading, getNodeValue, setNodeValue, handleSubmit } = useKratosFormState(
    nodes,
    onSubmit as any,
  )
  const justSaved = useJustSaved(isLoading, nodes.some((n) => n.messages.some((m) => m.type === "error")))

  if (!flow || nodes.length === 0) return null

  const defaultNodes = nodes.filter((n) => n.group === "default")
  const passwordNode = findInput(nodes, "password")
  const submitNode = nodes.find(
    (n) => isUiNodeInputAttributes(n.attributes) && n.attributes.type === "submit",
  )

  return (
    <form action={flow.ui.action} method={flow.ui.method} onSubmit={handleSubmit}>
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
      <div className="kset-card">
        <SectionHead
          title="Change password"
          sub="Choose a strong password. You may be asked to re-authenticate."
        />
        {passwordNode && (
          <>
            <Node
              node={passwordNode}
              labelOverride="New password"
              disabled={isLoading}
              value={getNodeValue(passwordNode)}
              setValue={(v) => setNodeValue(passwordNode, v)}
              dispatchSubmit={handleSubmit}
            />
            <StrengthMeter value={String(getNodeValue(passwordNode) ?? "")} />
          </>
        )}
        <div style={{ marginTop: 18 }}>
          {submitNode && (
            <SaveButton node={submitNode} label="Save" isLoading={isLoading} justSaved={justSaved} />
          )}
        </div>
      </div>
    </form>
  )
}

/* ── 2FA backup recovery codes ────────────────────────────────── */

function extractCodes(node?: UiNode): string[] {
  if (!node || !isUiNodeTextAttributes(node.attributes)) return []
  const ctx = (node.attributes as UiNodeTextAttributes).text.context as any
  const secrets = ctx?.secrets
  if (!Array.isArray(secrets)) return []
  return secrets.map((s: any) => String(s.text ?? ""))
}

// Kratos keeps a freshly regenerated (but not yet confirmed) set of backup
// codes attached to the flow as a text node — its presence is the signal
// that the standalone reveal view should replace the whole settings shell.
export function backupCodesArePending(flow?: SettingsFlow): boolean {
  if (!flow) return false
  return flow.ui.nodes.some(
    (n) => isUiNodeTextAttributes(n.attributes) && (n.attributes as UiNodeTextAttributes).text.id === 1050015,
  )
}

export function BackupCodesReveal({
  flow,
  onSubmit,
  onDiscard,
}: {
  flow?: SettingsFlow
  onSubmit: OnSubmit
  onDiscard: () => void
}) {
  const nodes = useMemo(() => nodesForGroup(flow, "lookup_secret"), [flow])
  const { isLoading, getNodeValue, setNodeValue, handleSubmit } = useKratosFormState(
    nodes,
    onSubmit as any,
  )
  const [copied, setCopied] = useState(false)
  const justSaved = useJustSaved(isLoading, nodes.some((n) => n.messages.some((m) => m.type === "error")))

  if (!flow) return null

  const defaultNodes = nodes.filter((n) => n.group === "default")
  const codesNode = nodes.find(
    (n) =>
      isUiNodeTextAttributes(n.attributes) &&
      (n.attributes as UiNodeTextAttributes).text.id === 1050015,
  )
  const confirmNode = findInput(nodes, "lookup_secret_confirm")
  const codes = extractCodes(codesNode)

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard access denied — nothing to do
    }
  }

  const downloadAll = () => {
    const blob = new Blob([codes.join("\n") + "\n"], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "backup-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <form action={flow.ui.action} method={flow.ui.method} onSubmit={handleSubmit}>
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
      <button
        type="button"
        className="klink"
        onClick={onDiscard}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 18,
          fontSize: 13.5,
        }}
      >
        <KIcon name="arrowLeft" size={15} />
        Back to settings
      </button>
      <h1 style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 8px", color: "var(--fg-0)" }}>
        Your backup codes
      </h1>
      <p style={{ fontSize: 13.5, color: "var(--fg-2)", margin: "0 0 18px", lineHeight: 1.5 }}>
        Store these somewhere safe. Each code can be used once if you lose access to your other methods.
      </p>
      <div className="kalert kalert-info">
        <KIcon name="info" size={16} />
        Treat these like passwords. They won&apos;t be shown in full again.
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          margin: "0 0 20px",
        }}
      >
        {codes.map((code, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              background: "var(--bg-2)",
              border: "0.5px solid var(--line-2)",
              borderRadius: 11,
              fontFamily: "var(--font-mono)",
              fontSize: 14,
            }}
          >
            <span style={{ color: "var(--fg-3)", fontSize: 12 }}>{i + 1}</span>
            {code}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <button type="button" className="kbtn kbtn-secondary full" onClick={copyAll}>
          <KIcon name={copied ? "check" : "copy"} size={16} color={copied ? "var(--accent-hi)" : "currentColor"} />
          {copied ? "Copied" : "Copy"}
        </button>
        <button type="button" className="kbtn kbtn-secondary full" onClick={downloadAll}>
          <KIcon name="download" size={16} />
          Download
        </button>
      </div>
      {confirmNode ? (
        <SaveButton node={confirmNode} label="Done" isLoading={isLoading} justSaved={justSaved} />
      ) : (
        // Reached via "View codes" rather than a regenerate — nothing to
        // persist, so Done is just a plain return to settings.
        <button type="button" className="kbtn kbtn-primary full" onClick={onDiscard}>
          Done
        </button>
      )}
    </form>
  )
}

// Kratos only advertises "lookup_secret_regenerate" as an actionable node
// once you've interacted with the method this session (revealed or just
// regenerated) — on a fresh page load with an already-active credential it
// only offers "reveal" and "disable". The regenerate action is still a
// documented, always-accepted field on the settings update body though, so
// this falls back to a synthetic node with the right name/value when the
// server hasn't handed us a real one, keeping the button always available
// (matching the design) without ever inventing data Kratos didn't send.
function regenerateFallbackNode(): UiNode {
  return {
    type: "input",
    group: "lookup_secret",
    attributes: {
      node_type: "input",
      name: "lookup_secret_regenerate",
      type: "submit",
      value: "true",
      disabled: false,
    },
    messages: [],
    meta: {},
  } as unknown as UiNode
}

export function BackupCodesSection({ flow, onSubmit }: { flow?: SettingsFlow; onSubmit: OnSubmit }) {
  const nodes = useMemo(() => nodesForGroup(flow, "lookup_secret"), [flow])
  const { isLoading, getNodeValue, setNodeValue, handleSubmit } = useKratosFormState(
    nodes,
    onSubmit as any,
  )

  if (!flow || nodes.length === 0) return null

  const defaultNodes = nodes.filter((n) => n.group === "default")
  const regenerateNode = findInput(nodes, "lookup_secret_regenerate") ?? regenerateFallbackNode()
  const revealNode = findInput(nodes, "lookup_secret_reveal")
  const disableNode = findInput(nodes, "lookup_secret_disable")
  const isActive = !!disableNode
  const revealAttrs = revealNode?.attributes as UiNodeInputAttributes | undefined
  const regenerateAttrs = regenerateNode.attributes as UiNodeInputAttributes

  return (
    <form action={flow.ui.action} method={flow.ui.method} onSubmit={handleSubmit}>
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
      <div className="kset-card">
        <SectionHead
          title="2FA backup recovery codes"
          sub="One-time codes to sign in if you lose your other 2FA methods."
        />
        {isActive ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 12,
              background: "var(--accent-soft)",
              border: "0.5px solid color-mix(in srgb, var(--accent-hi) 28%, transparent)",
              marginBottom: 18,
            }}
          >
            <KIcon name="checkCircle" size={20} color="var(--accent-hi)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Backup codes are active</div>
            </div>
            {revealAttrs && (
              <button
                type="submit"
                name={revealAttrs.name}
                value={String(revealAttrs.value ?? "")}
                disabled={revealAttrs.disabled || isLoading}
                className="kbtn kbtn-secondary kbtn-sm"
              >
                {isLoading ? <Spinner size={15} color="var(--fg-1)" /> : null}
                View codes
              </button>
            )}
          </div>
        ) : (
          <div className="kchip-empty" style={{ marginBottom: 18 }}>
            <KIcon name="shield" size={24} color="var(--fg-3)" />
            No backup codes generated yet.
          </div>
        )}
        <button
          type="submit"
          name={regenerateAttrs.name}
          value={String(regenerateAttrs.value ?? "")}
          disabled={regenerateAttrs.disabled || isLoading}
          className="kbtn kbtn-primary full"
        >
          {isLoading ? <Spinner size={17} color="#fff" /> : <KIcon name="refresh" size={17} color="#fff" />}
          Generate new backup recovery codes
        </button>
        {isActive && (
          <p style={{ fontSize: 12, color: "var(--fg-3)", margin: "12px 0 0" }}>
            Generating new codes invalidates any existing set.
          </p>
        )}
      </div>
    </form>
  )
}

/* ── Hardware tokens (WebAuthn) ───────────────────────────────── */

export function TokensSection({ flow, onSubmit }: { flow?: SettingsFlow; onSubmit: OnSubmit }) {
  const nodes = useMemo(() => nodesForGroup(flow, "webauthn"), [flow])
  const { isLoading, getNodeValue, setNodeValue, handleSubmit } = useKratosFormState(
    nodes,
    onSubmit as any,
  )

  if (!flow || nodes.length === 0) return null

  const defaultNodes = nodes.filter((n) => n.group === "default")
  const scriptNodes = nodes.filter((n) => isUiNodeScriptAttributes(n.attributes))
  const removeNodes = nodes.filter(
    (n) => isUiNodeInputAttributes(n.attributes) && n.attributes.name === "webauthn_remove",
  )
  const displayNameNode = findInput(nodes, "webauthn_register_displayname")
  const triggerNode = nodes.find(
    (n) =>
      isUiNodeInputAttributes(n.attributes) &&
      n.attributes.name === "webauthn_register_trigger",
  )
  const hiddenRegisterNode = findInput(nodes, "webauthn_register")

  return (
    <form action={flow.ui.action} method={flow.ui.method} onSubmit={handleSubmit}>
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
      <div className="kset-card">
        <SectionHead
          title="Hardware tokens"
          sub="Manage WebAuthn security keys (e.g. YubiKey) registered to your account."
        />
        {removeNodes.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {removeNodes.map((node, k) => {
              const { displayName, meta } = credentialMeta(node)
              return (
                <CredentialRow
                  key={k}
                  icon="key"
                  name={displayName}
                  meta={meta}
                  removeNode={node}
                  disabled={isLoading}
                />
              )
            })}
          </div>
        )}
        {displayNameNode && (
          <Node
            node={displayNameNode}
            disabled={isLoading}
            value={getNodeValue(displayNameNode)}
            setValue={(v) => setNodeValue(displayNameNode, v)}
            dispatchSubmit={handleSubmit}
          />
        )}
        {hiddenRegisterNode && (
          <Node
            node={hiddenRegisterNode}
            disabled={isLoading}
            value={getNodeValue(hiddenRegisterNode)}
            setValue={(v) => setNodeValue(hiddenRegisterNode, v)}
            dispatchSubmit={handleSubmit}
          />
        )}
        {triggerNode && isUiNodeInputAttributes(triggerNode.attributes) && (
          <button
            type="button"
            className="kbtn kbtn-primary full"
            disabled={triggerNode.attributes.disabled || isLoading}
            onClick={() => {
              const onclick = (triggerNode.attributes as UiNodeInputAttributes).onclick
              if (onclick) callWebauthnFunction(onclick)
            }}
          >
            <KIcon name="plus" size={17} color="#fff" />
            Add security key
          </button>
        )}
      </div>
    </form>
  )
}

/* ── Passkeys ─────────────────────────────────────────────────── */
// Ory Kratos "passkey" method is not yet configured on this project's
// identity server (see project memory) — this renders generically off of
// whatever the flow actually returns, so it lights up automatically once
// the backend config adds the method, without another UI change.

export function PasskeysSection({ flow, onSubmit }: { flow?: SettingsFlow; onSubmit: OnSubmit }) {
  const nodes = useMemo(() => nodesForGroup(flow, "passkey"), [flow])
  const { isLoading, getNodeValue, setNodeValue, handleSubmit } = useKratosFormState(
    nodes,
    onSubmit as any,
  )

  if (!flow || nodes.length === 0) return null

  const defaultNodes = nodes.filter((n) => n.group === "default")
  const scriptNodes = nodes.filter((n) => isUiNodeScriptAttributes(n.attributes))
  const removeNodes = nodes.filter(
    (n) =>
      isUiNodeInputAttributes(n.attributes) &&
      n.attributes.type === "submit" &&
      n.attributes.name.includes("remove"),
  )
  const triggerNode = nodes.find(
    (n) =>
      isUiNodeInputAttributes(n.attributes) &&
      n.attributes.type === "button" &&
      n.attributes.name.includes("trigger"),
  )
  const handledNames = new Set(
    [...removeNodes, triggerNode].filter(Boolean).map((n) => (n!.attributes as UiNodeInputAttributes).name),
  )
  const remainingNodes = nodes.filter(
    (n) =>
      (n.group as string) === "passkey" &&
      isUiNodeInputAttributes(n.attributes) &&
      !handledNames.has(n.attributes.name),
  )

  return (
    <form action={flow.ui.action} method={flow.ui.method} onSubmit={handleSubmit}>
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
      <div className="kset-card">
        <SectionHead
          title="Passkeys"
          sub="Sign in without a password using your device's biometrics."
        />
        {removeNodes.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {removeNodes.map((node, k) => {
              const { displayName, meta } = credentialMeta(node)
              return (
                <CredentialRow
                  key={k}
                  icon="fingerprint"
                  name={displayName}
                  meta={meta}
                  removeNode={node}
                  disabled={isLoading}
                />
              )
            })}
          </div>
        ) : (
          <div className="kchip-empty" style={{ marginBottom: 20 }}>
            <KIcon name="fingerprint" size={24} color="var(--fg-3)" />
            No passkeys yet. Add one for faster, safer sign-in.
          </div>
        )}
        {remainingNodes.map((node, k) => (
          <Node
            key={`rest-${k}`}
            node={node}
            disabled={isLoading}
            value={getNodeValue(node)}
            setValue={(v) => setNodeValue(node, v)}
            dispatchSubmit={handleSubmit}
          />
        ))}
        {triggerNode && isUiNodeInputAttributes(triggerNode.attributes) && (
          <button
            type="button"
            className="kbtn kbtn-primary full"
            disabled={triggerNode.attributes.disabled || isLoading}
            onClick={() => {
              const onclick = (triggerNode.attributes as UiNodeInputAttributes).onclick
              if (onclick) callWebauthnFunction(onclick)
            }}
          >
            <KIcon name="plus" size={17} color="#fff" />
            Add passkey
          </button>
        )}
      </div>
    </form>
  )
}

/* ── Authenticator app (TOTP) ─────────────────────────────────── */

export function AuthenticatorSection({ flow, onSubmit }: { flow?: SettingsFlow; onSubmit: OnSubmit }) {
  const nodes = useMemo(() => nodesForGroup(flow, "totp"), [flow])
  const { isLoading, getNodeValue, setNodeValue, handleSubmit } = useKratosFormState(
    nodes,
    onSubmit as any,
  )
  const [copied, setCopied] = useState(false)
  const justSaved = useJustSaved(isLoading, nodes.some((n) => n.messages.some((m) => m.type === "error")))

  if (!flow || nodes.length === 0) return null

  const defaultNodes = nodes.filter((n) => n.group === "default")
  const qrNode = nodes.find((n) => isUiNodeImageAttributes(n.attributes))
  const secretNode = nodes.find(
    (n) => isUiNodeTextAttributes(n.attributes) && n.attributes.id === "totp_secret_key",
  )
  const codeNode = findInput(nodes, "totp_code")
  const submitNode = nodes.find(
    (n) => isUiNodeInputAttributes(n.attributes) && n.attributes.type === "submit",
  )

  const secretText = secretNode
    ? (secretNode.attributes as UiNodeTextAttributes).text.text
    : ""
  const secretDisplay = secretText.match(/.{1,4}/g)?.join(" ") ?? secretText

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secretText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard access denied — nothing to do
    }
  }

  return (
    <form action={flow.ui.action} method={flow.ui.method} onSubmit={handleSubmit}>
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
      <div className="kset-card">
        <SectionHead
          title="Authenticator app (TOTP)"
          sub="Scan the QR code with an authenticator app, then enter the generated code to confirm."
        />
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "flex-start" }}>
          {qrNode && (
            <div>
              <div className="klabel" style={{ marginBottom: 10 }}>
                Authenticator QR code
              </div>
              <div
                style={{
                  background: "#fff",
                  padding: 12,
                  borderRadius: 12,
                  width: 176,
                  height: 176,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={(qrNode.attributes as UiNodeImageAttributes).src}
                  alt="Authenticator app QR code"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 220 }}>
            {secretNode && (
              <>
                <div className="klabel" style={{ marginBottom: 8 }}>
                  Or enter this secret manually
                </div>
                <div
                  className="krow"
                  style={{
                    padding: "12px 14px",
                    borderRadius: 11,
                    background: "var(--bg-1)",
                    border: "0.5px solid var(--line-2)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 14,
                      letterSpacing: "0.08em",
                      color: "var(--fg-1)",
                    }}
                  >
                    {secretDisplay}
                  </span>
                  <button
                    type="button"
                    className="ktrail"
                    style={{ position: "static", width: 32, height: 32 }}
                    onClick={copySecret}
                    aria-label="Copy secret"
                  >
                    <KIcon
                      name={copied ? "check" : "copy"}
                      size={16}
                      color={copied ? "var(--accent-hi)" : "var(--fg-3)"}
                    />
                  </button>
                </div>
              </>
            )}
            <div style={{ marginTop: 18 }}>
              {codeNode && (
                <Node
                  node={codeNode}
                  labelOverride="Verify code"
                  disabled={isLoading}
                  value={getNodeValue(codeNode)}
                  setValue={(v) => setNodeValue(codeNode, v)}
                  dispatchSubmit={handleSubmit}
                />
              )}
              {submitNode && (
                <SaveButton
                  node={submitNode}
                  label="Confirm & enable"
                  isLoading={isLoading}
                  justSaved={justSaved}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
