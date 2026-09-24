import { AxiosError } from "axios"
import { NextRouter } from "next/router"
import { Dispatch, SetStateAction } from "react"
import { toast } from "react-toastify"

type FlowErrorResponse = {
  error?: { id?: string }
  redirect_browser_to: string
}

/**
 * Kratos answers "you need a second factor" with a redirect to whatever URL is
 * configured as the project's Login UI. When this app runs somewhere else than
 * that configured URL — e.g. locally on :4456 while the project points at the
 * hosted UI — following that redirect lands the browser on an origin that
 * can't see this app's session cookie, and Kratos rejects it with
 * `session_aal1_required`. Building the aal2 flow through this app's own
 * origin instead keeps the cookie attached.
 *
 * Set this to `false` (or delete the guard below) once the project's Login UI
 * URL matches wherever this app is deployed — then Kratos's own redirect is
 * always correct and this is unnecessary.
 */
const PREFER_SAME_ORIGIN_AAL2 = true

// A small function to help us deal with errors coming from fetching a flow.
export function handleGetFlowError<S>(
  router: NextRouter,
  flowType: "login" | "registration" | "settings" | "recovery" | "verification",
  resetFlow: Dispatch<SetStateAction<S | undefined>>,
) {
  return async (err: AxiosError<FlowErrorResponse>) => {
    switch (err.response?.data.error?.id) {
      case "session_inactive":
        await router.push("/login?return_to=" + window.location.href)
        return
      case "session_aal2_required": {
        const target = err.response?.data.redirect_browser_to
        const offOrigin =
          !!target && new URL(target, window.location.origin).origin !== window.location.origin

        if (target && !(PREFER_SAME_ORIGIN_AAL2 && offOrigin)) {
          const redirectTo = new URL(target)
          if (flowType === "settings") {
            redirectTo.searchParams.set("return_to", window.location.href)
          }
          // 2FA is enabled and enforced, but user did not perform 2fa yet!
          window.location.href = redirectTo.toString()
          return
        }
        // Same-origin aal2 flow. No return_to: Kratos rejects any address that
        // isn't on its allow-list, and that rejection loops back through this
        // handler. /login's own post-login default lands the user correctly.
        await router.push("/login?aal=aal2")
        return
      }
      case "session_already_available":
        // User is already signed in, let's redirect them home!
        await router.push("/")
        return
      case "session_refresh_required":
        // We need to re-authenticate to perform this action
        window.location.href = err.response?.data.redirect_browser_to
        return
      case "self_service_flow_return_to_forbidden":
        // The flow expired, let's request a new one.
        toast.error("The return_to address is not allowed.")
        resetFlow(undefined)
        await router.push("/" + flowType)
        return
      case "self_service_flow_expired":
        // The flow expired, let's request a new one.
        toast.error("Your interaction expired, please fill out the form again.")
        resetFlow(undefined)
        await router.push("/" + flowType)
        return
      case "security_csrf_violation":
        // A CSRF violation occurred. Best to just refresh the flow!
        toast.error(
          "A security violation was detected, please fill out the form again.",
        )
        resetFlow(undefined)
        await router.push("/" + flowType)
        return
      case "security_identity_mismatch":
        // The requested item was intended for someone else. Let's request a new flow...
        resetFlow(undefined)
        await router.push("/" + flowType)
        return
      case "browser_location_change_required":
        // Ory Kratos asked us to point the user to this URL.
        window.location.href = err.response.data.redirect_browser_to
        return
    }

    switch (err.response?.status) {
      case 410:
        // The flow expired, let's request a new one.
        resetFlow(undefined)
        await router.push("/" + flowType)
        return
    }

    // We are not able to handle the error? Return it.
    return Promise.reject(err)
  }
}

// A small function to help us deal with errors coming from initializing a flow.
export const handleFlowError = handleGetFlowError
