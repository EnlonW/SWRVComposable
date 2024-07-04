import { useSWRConfig, normalizeArgs, mergeConfigs } from "."

export const withArgs = <SWRHook>(hook: any) => {
  return function useSWRArgs(...args: any) {
    // Get the default and inherited configuration.
    const fallbackConfig = useSWRConfig()

    // Normalize arguments.
    const [key, fn, _config] = normalizeArgs<any, any>(args)

    // Merge configurations.
    const config = mergeConfigs(fallbackConfig, _config)

    return hook(key, fn || config.fetcher || null, config)
  } as unknown as SWRHook
}
