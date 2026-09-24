import type { NextApiRequest, NextApiResponse } from "next"

import {
  acceptConsentRequest,
  getConsentRequest,
  rejectConsentRequest,
} from "../../pkg/hydraAdmin"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end()
    return
  }

  const { challenge, submit, remember } = req.body

  if (submit === "Deny access") {
    const { redirect_to } = await rejectConsentRequest(challenge)
    res.redirect(302, redirect_to)
    return
  }

  let grantScope: string[] = req.body.grant_scope ?? []
  if (!Array.isArray(grantScope)) {
    grantScope = [grantScope]
  }

  // Re-fetch to get requested_access_token_audience — it isn't round-tripped
  // through the form.
  const consentRequest = await getConsentRequest(challenge)

  const { redirect_to } = await acceptConsentRequest(challenge, {
    grant_scope: grantScope,
    grant_access_token_audience: consentRequest.requested_access_token_audience,
    remember: Boolean(remember),
    remember_for: 3600,
  })
  res.redirect(302, redirect_to)
}
