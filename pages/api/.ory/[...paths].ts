// @ory/integrations offers a package for integrating with NextJS.
import { config, createApiHandler } from "@ory/integrations/next-edge"

// We need to export the config.
export { config }

// And create the Ory Cloud API "bridge".
export default createApiHandler({
  fallbackToPlayground: true,
  // The proxy rewrites the Domain of every cookie Kratos sets. With
  // `dontUseTldForCookieDomain: true` it pins them to this exact host
  // (accounts.nirah.nl), so the session cookie is NEVER sent to the other
  // *.nirah.nl sites. That broke the admin portal (admin.nirah.nl): Oathkeeper
  // forwards the browser's cookies to Kratos' /sessions/whoami and got "no
  // active session". Without the option the cookies get the registrable domain
  // (nirah.nl), the same domain Kratos itself is configured with
  // (`cookies.domain: nirah.nl`). Only vercel.app-style public suffixes need
  // the option, and nirah.nl is not one.
  // we require this since we are proxying the Ory requests through nextjs
  // Ory needs to know about our host to generate the correct urls for redirecting back between flows
  // For example between Login MFA and Settings
  forwardAdditionalHeaders: ["x-forwarded-host"],
})
