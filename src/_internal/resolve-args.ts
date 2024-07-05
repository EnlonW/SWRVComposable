import { mergeConfigs } from "./merge-configs"
import { normalizeArgs } from "./normalize-args"
import { useSWRConfig } from "./use-swr-config"

export const withArgs = <SWRHook>(hook: any) => {
  return function useSWRArgs(...args: any) {
    const fallbackConfig = useSWRConfig()

    const [key, fn, _config] = normalizeArgs<any, any>(args)

    const config = mergeConfigs(fallbackConfig, _config)

    return hook(key, fn || config.fetcher || null, config)
  } as unknown as SWRHook
}
