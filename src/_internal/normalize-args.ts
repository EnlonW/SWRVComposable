import { defaultConfig } from "./config"
import type { Fetcher, SWRKey, SWRConfig } from "../types"
import { mergeConfigs } from "./merge-configs"

export function normalizeArgs<Data = any, Error = any>(args: any[]): [SWRKey, Fetcher<Data> | null, SWRConfig<Data, Error>] {
  const key: SWRKey = args[0]
  let fetcher: Fetcher<Data> | null = null
  let options: SWRConfig<Data, Error> = defaultConfig

  if (args.length >= 2) {
    if (typeof args[1] === 'function') {
      fetcher = args[1]
    } else {
      options = mergeConfigs(options, args[1] ?? {})
    }
  }

  if (args.length >= 3) {
    options = mergeConfigs(options, args[2] ?? {})
  }

  return [key, fetcher, options]
}
