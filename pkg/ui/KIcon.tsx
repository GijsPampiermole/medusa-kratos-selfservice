import React from "react"

const P: Record<string, React.ReactNode> = {
  eye: <g><path d="M2 12 S5.5 5 12 5 S22 12 22 12 S18.5 19 12 19 S2 12 2 12 Z" /><circle cx="12" cy="12" r="3" /></g>,
  eyeOff: <g><path d="M2 12 S5.5 5.5 12 5.5 c1.6 0 3 .35 4.3.9 M22 12 S18.5 18.5 12 18.5 c-1.2 0-2.3-.2-3.3-.55" /><path d="M9.8 9.8 a3 3 0 0 0 4.4 4.1" /><path d="M3.5 3.5 L20.5 20.5" /></g>,
  arrowLeft: <path d="M11 5 L4 12 L11 19 M4 12 H20" />,
  arrowRight: <path d="M13 5 L20 12 L13 19 M20 12 H4" />,
  check: <path d="M5 12.5 L10 17.5 L19 6.5" />,
  checkCircle: <g><circle cx="12" cy="12" r="9" /><path d="M8 12.2 L11 15.2 L16 9" /></g>,
  mail: <g><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M4 7 L12 13 L20 7" /></g>,
  lock: <g><rect x="5" y="11" width="14" height="9" rx="2.4" /><path d="M8 11 V8 A4 4 0 0 1 16 8 V11" /></g>,
  key: <g><circle cx="8" cy="8" r="4.2" /><path d="M11 11 L20 20 M16.5 16.5 L19 14 M14 14 L17 17" /></g>,
  shield: <g><path d="M12 3 L19 6 V11 C19 16 16 19.5 12 21 C8 19.5 5 16 5 11 V6 Z" /><path d="M9 12 L11.2 14.2 L15.5 9.5" /></g>,
  fingerprint: <g><path d="M12 5.5 c-3.6 0-6.5 2.9-6.5 6.5 v2" /><path d="M12 8.5 c-2 0-3.5 1.6-3.5 3.5 v3.5" /><path d="M12 11.5 v4.5" /><path d="M18.5 12 c0-3.6-2.9-6.5-6.5-6.5" /><path d="M15.5 12.5 v2.5 c0 1.2-.2 2-.5 3" /></g>,
  smartphone: <g><rect x="7" y="3" width="10" height="18" rx="2.4" /><path d="M11 18 H13" /></g>,
  qr: <g><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14 H17 V17 M20 14 V20 H14" /></g>,
  copy: <g><rect x="9" y="9" width="11" height="11" rx="2.4" /><path d="M5 15 H4.5 A1.5 1.5 0 0 1 3 13.5 V5 A2 2 0 0 1 5 3 H13.5 A1.5 1.5 0 0 1 15 4.5 V5" /></g>,
  refresh: <g><path d="M20 11 A8 8 0 1 0 18.5 15.5" /><path d="M20 4.5 V11 H13.5" /></g>,
  download: <g><path d="M12 4 V15 M7.5 10.5 L12 15 L16.5 10.5" /><path d="M5 19 H19" /></g>,
  logout: <g><path d="M15 4 H6 A2 2 0 0 0 4 6 V18 A2 2 0 0 0 6 20 H15" /><path d="M18 12 H9 M15 8.5 L18.5 12 L15 15.5" /></g>,
  user: <g><circle cx="12" cy="8" r="4" /><path d="M4.5 20 a7.5 7.5 0 0 1 15 0" /></g>,
  chevronDown: <path d="M5 9 L12 16 L19 9" />,
  chevronRight: <path d="M9 5 L16 12 L9 19" />,
  alert: <g><path d="M12 4 L21 19 H3 Z" /><path d="M12 10 V14 M12 16.5 V16.6" /></g>,
  info: <g><circle cx="12" cy="12" r="9" /><path d="M12 11 V16 M12 8 V8.1" /></g>,
  x: <path d="M6 6 L18 18 M18 6 L6 18" />,
  plus: <path d="M12 5 V19 M5 12 H19" />,
  trash: <g><path d="M5 7 H19 M10 7 V5 H14 V7 M7 7 L8 20 H16 L17 7" /></g>,
  sun: <g><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5 V5 M12 19 V21.5 M21.5 12 H19 M5 12 H2.5 M18.4 5.6 L16.6 7.4 M7.4 16.6 L5.6 18.4 M18.4 18.4 L16.6 16.6 M7.4 7.4 L5.6 5.6" /></g>,
  moon: <path d="M20 14 A8.5 8.5 0 0 1 9.5 4 A7 7 0 1 0 20 14 Z" />,
  leaf: <g><path d="M5 19 C 5 11 11 5 19 5 C 19 13 13 19 5 19 Z" /><path d="M5 19 C 9 15 12 12 16 10" /></g>,
}

interface Props {
  name: keyof typeof P
  size?: number
  color?: string
  strokeWidth?: number
  style?: React.CSSProperties
}

export function KIcon({ name, size = 20, color = "currentColor", strokeWidth = 1.7, style }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {P[name] ?? null}
    </svg>
  )
}
