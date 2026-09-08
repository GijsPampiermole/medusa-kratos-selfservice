import { KIcon } from "./KIcon"

export function AuthFooter() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        marginTop: 26,
        color: "var(--fg-3)",
      }}
    >
      <KIcon name="shield" size={13} color="var(--fg-3)" />
      <span style={{ fontSize: 11.5, letterSpacing: "0.02em" }}>
        Secured authentication
      </span>
    </div>
  )
}
