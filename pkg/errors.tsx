import { AxiosError } from "axios"
import { NextRouter } from "next/router"
import { Dispatch, SetStateAction } from "react"
import { toast } from "react-toastify"

type FlowErrorResponse = {
  error?: { id?: string }
  redirect_browser_to: string
}

// A small function to help us deal with errors coming from fetching a flow.
export function handleGetFlowError<S>(
  router: NextRouter,
  flowType: "login" | "registration" | "settings" | "recovery" | "verification",
  resetFlow: Dispatch<SetStateAction<S | undefined>>,
) {
  return async (err: AxiosError<FlowErrorResponse>) => {
    switch (err.response?.data.error?.id) {
      case "session_inactive":
        // Note: deliberately not appending `?return_to=<current URL>` here —
        // Kratos rejects any return_to address that isn't on its allowed
        // list (typically only the app's real deployed domain), and a
        // rejected return_to loops right back into this same handler via
        // self_service_flow_return_to_forbidden. Landing on plain /login
        // and letting its own post-login default (/settings) take over is
        // more reliable than a return_to that may not be allowed.
        await router.push("/login")
        return
      case "session_aal2_required": {
        // 2FA is enabled and enforced, but the user hasn't completed it yet.
        // Kratos suggests a redirect_browser_to, but only trust it when it
        // points back at this app's own origin: this app's session cookie
        // is scoped to its own origin by the /api/.ory proxy, so a
        // cross-origin redirect_browser_to (e.g. a hosted project's
        // configured production URL, seen when developing locally against
        // it) lands on a page with no session at all and immediately fails
        // with "session_aal1_required". Our own /login route creates the
        // aal2 flow through this same origin instead, which does carry it.
        const redirectBrowserTo = err.response?.data.redirect_browser_to
        const isSameOrigin =
          !!redirectBrowserTo &&
          new URL(redirectBrowserTo, window.location.origin).origin === window.location.origin
        if (redirectBrowserTo && isSameOrigin) {
          const redirectTo = new URL(redirectBrowserTo)
          if (flowType === "settings") {
            redirectTo.searchParams.set("return_to", window.location.href)
          }
          window.location.href = redirectTo.toString()
          return
        }
        // No return_to here either, for the same reason as session_inactive
        // above — /login's own default (/settings) is where this should
        // land anyway.
        await router.push("/login?aal=aal2")
        return
      }
      case "session_already_available":
        // User is already signed in, let's redirect them to settings!
        await router.push("/settings")
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
