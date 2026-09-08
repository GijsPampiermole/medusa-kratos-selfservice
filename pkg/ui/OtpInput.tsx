import { ClipboardEvent, KeyboardEvent, useRef } from "react"

interface Props {
  length?: number
  value: string
  onChange: (v: string) => void
}

export function OtpInput({ length = 6, value, onChange }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const set = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1)
    const arr = value.split("")
    arr[i] = d
    const next = arr.join("").slice(0, length)
    onChange(next)
    if (d && i < length - 1) refs.current[i + 1]?.focus()
  }

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const d = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, length)
    onChange(d)
    refs.current[Math.min(d.length, length - 1)]?.focus()
  }

  return (
    <div className="kotp" onPaste={onPaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          inputMode="numeric"
          maxLength={1}
          className={value[i] ? "filled" : ""}
          value={value[i] || ""}
          onChange={(e) => set(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}
