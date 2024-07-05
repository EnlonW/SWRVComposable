import { inject, provide } from "vue"
import { mergeObjects } from "./shared"
import { defaultConfig } from "./config"
import type { SWRConfig } from "../types"

export const SWRConfigContext = Symbol('SWRConfigContext')

export const useProvideSWRConfig = (config: Partial<SWRConfig>) => {
  provide(SWRConfigContext, config)
}

export const useSWRConfig = () => {
  const context = inject<Partial<SWRConfig>>(SWRConfigContext, {})
  return mergeObjects(defaultConfig, context)
}
