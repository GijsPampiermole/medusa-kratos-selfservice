import { NodeInputProps, useOnload } from "./helpers"

export function NodeInputHidden<T>({ attributes }: NodeInputProps) {
  useOnload(attributes as any)

  // No fallback value here: this renders every "hidden" node generically
  // (csrf_token, WebAuthn's script-populated fields, etc.), not just
  // boolean-style ones, so substituting a hardcoded "true" for anything
  // falsy/empty would submit a bogus CSRF token instead of Kratos's real
  // one whenever it's momentarily empty — trust whatever Kratos sent.
  return (
    <input
      type={attributes.type}
      name={attributes.name}
      value={attributes.value ?? ""}
    />
  )
}
