import { UiNode } from "@ory/client"
import { getNodeId, isUiNodeInputAttributes } from "@ory/integrations/ui"
import { FormEvent, MouseEvent, useEffect, useState } from "react"

type Values = Record<string, any>

export function useKratosFormState(
  nodes: UiNode[],
  onSubmit: (values: Values) => Promise<void>,
) {
  const [values, setValues] = useState<Values>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const vals: Values = {}
    nodes.forEach((node) => {
      if (isUiNodeInputAttributes(node.attributes)) {
        const { type, name, value } = node.attributes
        if (type !== "button" && type !== "submit") {
          vals[name] = value
        }
      }
    })
    setValues(vals)
  }, [nodes])

  const setValue = (name: string, value: any) =>
    new Promise<void>((resolve) => {
      setValues((prev) => ({ ...prev, [name]: value }))
      resolve()
    })

  const handleSubmit = (e: FormEvent<HTMLFormElement> | MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (isLoading) return Promise.resolve()

    let body: Values = {}
    const form = e.currentTarget

    if (form instanceof HTMLFormElement) {
      body = Object.fromEntries(new FormData(form)) as Values
      const native = (e as FormEvent<HTMLFormElement>).nativeEvent as any
      if (native?.submitter?.name) {
        body[native.submitter.name] = native.submitter.value
      }
    }

    setIsLoading(true)
    return onSubmit({ ...body, ...values }).finally(() => setIsLoading(false))
  }

  const getNodeValue = (node: UiNode) => {
    const id = getNodeId(node) as string
    return values[id]
  }

  const setNodeValue = (node: UiNode, value: any) => {
    const id = getNodeId(node) as string
    return setValue(id, value)
  }

  return { values, isLoading, setValue, setNodeValue, getNodeValue, handleSubmit }
}
