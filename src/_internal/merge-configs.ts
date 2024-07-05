import type { SWRConfig } from "../types"
import { mergeObjects } from "./shared"

export const mergeConfigs = (a: Partial<SWRConfig>,b?: Partial<SWRConfig>): SWRConfig => {
  const merged = mergeObjects(a, b)
  return merged
}
