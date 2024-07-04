import { inject } from "vue"
import { mergeObjects, defaultConfig } from "."
import type { Options } from "../types"

const SWRConfigContext = Symbol('SWRConfigContext')
export const useSWRConfig = () => {
  const context = inject<Options>(SWRConfigContext)
  return mergeObjects(defaultConfig, context)
}
