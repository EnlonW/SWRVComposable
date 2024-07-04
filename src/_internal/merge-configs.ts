import type { Options } from "../types"
import { mergeObjects } from "./shared"

export const mergeConfigs = (a: Partial<Options>,b?: Partial<Options>): Options => {
  const merged = mergeObjects(a, b)
  return merged
}
