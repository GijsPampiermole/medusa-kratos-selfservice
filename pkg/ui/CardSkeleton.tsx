/**
 * Placeholder shown while a Kratos flow is still being fetched.
 *
 * The flow is fetched client-side after hydration, so there is always a
 * round trip before any field can render. Rather than an empty card that
 * suddenly fills in, we lay out shapes matching what's about to arrive, so
 * the card keeps its height and the real fields fade in over the top.
 */

type Row = "field" | "button" | "divider" | "link" | "sso" | "otp"

const ROW_HEIGHT: Record<Row, number> = {
  field: 50,
  button: 50,
  divider: 18,
  link: 14,
  sso: 46,
  otp: 56,
}

/** A labelled field is a small label bar plus the input itself. */
function SkeletonRow({ row, index }: { row: Row; index: number }) {
  const delay = `${Math.min(index, 7) * 45}ms`

  if (row === "divider") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "22px 0" }}>
        <div style={{ flex: 1, height: 1, background: "var(--line-2)" }} />
        <div className="kskeleton" style={{ width: 46, height: 9, borderRadius: 999, animationDelay: delay }} />
        <div style={{ flex: 1, height: 1, background: "var(--line-2)" }} />
      </div>
    )
  }

  if (row === "sso") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            className="kskeleton"
            style={{ height: ROW_HEIGHT.sso, borderRadius: "var(--r-md)", animationDelay: delay }}
          />
        ))}
      </div>
    )
  }

  if (row === "otp") {
    return (
      <div style={{ display: "flex", gap: 9, justifyContent: "center", margin: "8px 0 22px" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="kskeleton"
            style={{ width: 46, height: ROW_HEIGHT.otp, borderRadius: 12, animationDelay: `${i * 45}ms` }}
          />
        ))}
      </div>
    )
  }

  if (row === "link") {
    return (
      <div
        className="kskeleton"
        style={{ width: 118, height: ROW_HEIGHT.link, borderRadius: 999, margin: "-6px 0 20px", animationDelay: delay }}
      />
    )
  }

  if (row === "button") {
    return (
      <div
        className="kskeleton"
        style={{ height: ROW_HEIGHT.button, borderRadius: "var(--r-md)", marginBottom: 8, animationDelay: delay }}
      />
    )
  }

  // field: label bar + input
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        className="kskeleton"
        style={{ width: 68, height: 9, borderRadius: 999, marginBottom: 10, animationDelay: delay }}
      />
      <div
        className="kskeleton"
        style={{ height: ROW_HEIGHT.field, borderRadius: "var(--r-md)", animationDelay: delay }}
      />
    </div>
  )
}

export function CardSkeleton({ rows }: { rows: Row[] }) {
  return (
    <div aria-hidden="true" data-testid="card-skeleton">
      {rows.map((row, i) => (
        <SkeletonRow key={i} row={row} index={i} />
      ))}
    </div>
  )
}
