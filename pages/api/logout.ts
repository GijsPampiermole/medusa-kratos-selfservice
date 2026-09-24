import type { NextApiRequest, NextApiResponse } from "next"

import { acceptLogoutRequest, rejectLogoutRequest } from "../../pkg/hydraAdmin"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end()
    return
  }

  const { challenge, submit } = req.body

  if (submit === "No") {
    await rejectLogoutRequest(challenge)
    res.redirect(302, "/")
    return
  }

  const { redirect_to } = await acceptLogoutRequest(challenge)
  res.redirect(302, redirect_to)
}
