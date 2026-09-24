// Server-side only. Hydra's Admin API is not exposed publicly (only
// reachable at HYDRA_ADMIN_URL inside the cluster), so every function here
// must run in getServerSideProps or an API route, never in the browser.
// Paths match what Kratos itself calls for the login_challenge cooperation
// (confirmed against this cluster's own logs) — same API family, v2.3.0.

const HYDRA_ADMIN_URL = process.env.HYDRA_ADMIN_URL

async function hydraFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!HYDRA_ADMIN_URL) {
    throw new Error("HYDRA_ADMIN_URL is not set")
  }
  const res = await fetch(`${HYDRA_ADMIN_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
  if (!res.ok) {
    throw new Error(
      `Hydra admin API ${path} failed: ${res.status} ${await res.text()}`,
    )
  }
  if (res.status === 204) {
    return undefined as T
  }
  return res.json() as Promise<T>
}

export type OAuth2Client = {
  client_id: string
  client_name?: string
}

export type ConsentRequest = {
  skip: boolean
  subject: string
  client: OAuth2Client
  requested_scope: string[]
  requested_access_token_audience: string[]
}

export type LogoutRequest = {
  subject: string
  sid: string
}

const encode = (challenge: string) => encodeURIComponent(challenge)

export function getConsentRequest(challenge: string) {
  return hydraFetch<ConsentRequest>(
    `/admin/oauth2/auth/requests/consent?consent_challenge=${encode(challenge)}`,
  )
}

export function acceptConsentRequest(
  challenge: string,
  body: {
    grant_scope: string[]
    grant_access_token_audience: string[]
    remember?: boolean
    remember_for?: number
  },
) {
  return hydraFetch<{ redirect_to: string }>(
    `/admin/oauth2/auth/requests/consent/accept?consent_challenge=${encode(challenge)}`,
    { method: "PUT", body: JSON.stringify(body) },
  )
}

export function rejectConsentRequest(challenge: string) {
  return hydraFetch<{ redirect_to: string }>(
    `/admin/oauth2/auth/requests/consent/reject?consent_challenge=${encode(challenge)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        error: "access_denied",
        error_description: "The resource owner denied the request",
      }),
    },
  )
}

export function getLogoutRequest(challenge: string) {
  return hydraFetch<LogoutRequest>(
    `/admin/oauth2/auth/requests/logout?logout_challenge=${encode(challenge)}`,
  )
}

export function acceptLogoutRequest(challenge: string) {
  return hydraFetch<{ redirect_to: string }>(
    `/admin/oauth2/auth/requests/logout/accept?logout_challenge=${encode(challenge)}`,
    { method: "PUT" },
  )
}

export function rejectLogoutRequest(challenge: string) {
  return hydraFetch<void>(
    `/admin/oauth2/auth/requests/logout/reject?logout_challenge=${encode(challenge)}`,
    { method: "PUT" },
  )
}
