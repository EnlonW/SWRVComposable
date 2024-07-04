import { defaultConfig } from "./config"
import type { Fetcher, Key, Options } from "../types"
import { mergeConfigs } from "./merge-configs"

export function normalizeArgs<Data = any, Error = any>(args: any[]): [Key, Fetcher<Data> | null, Options<Data, Error>] {
  const key: Key = args[0]
  let fetcher: Fetcher<Data> | null = null
  let options: Options<Data, Error> = defaultConfig

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
