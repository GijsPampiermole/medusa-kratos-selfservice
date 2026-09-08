interface Props {
  value: string
}

function score(pw: string) {
  if (!pw) return { s: 0, label: "", color: "var(--line-2)" }
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  s = Math.min(s, 4)
  const meta = [
    { label: "", color: "var(--line-2)" },
    { label: "Weak", color: "var(--crit)" },
    { label: "Fair", color: "var(--warn)" },
    { label: "Good", color: "var(--cool)" },
    { label: "Strong", color: "var(--accent-hi)" },
  ][s]
  return { s, ...meta }
}

export function StrengthMeter({ value }: Props) {
  const { s, label, color } = score(value)
  if (!value) return null
  return (
    <div>
      <div className="kstrength">
        {[0, 1, 2, 3].map((i) => (
          <i key={i} style={{ background: i < s ? color : "var(--line-2)" }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
        <span style={{ fontSize: 11.5, color: "var(--fg-3)" }}>
          Use 8+ chars, mixed case, a number &amp; symbol
        </span>
        <span style={{ fontSize: 11.5, color, fontWeight: 600 }}>{label}</span>
      </div>
    </div>
  )
}
