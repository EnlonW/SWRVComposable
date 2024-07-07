import { isUndefined, mergeObjects, noop } from "./shared";
import type { SWRConfig, Revalidator, RevalidatorOptions } from "../types";
import { initCache } from "./cache";

const onErrorRetry = (
  _: unknown,
  __: string,
  config: Readonly<SWRConfig>,
  revalidate: Revalidator,
  opts: Required<RevalidatorOptions>
): void => {
  const maxRetryCount = config.errorRetryCount
  const currentRetryCount = opts.retryCount

  // Exponential backoff
  const timeout =
    ~~(
      (Math.random() + 0.5) *
      (1 << (currentRetryCount < 8 ? currentRetryCount : 8))
    ) * config.errorRetryInterval

  if (!isUndefined(maxRetryCount) && currentRetryCount > maxRetryCount) {
    return
  }

  setTimeout(revalidate, timeout, opts)
}

const [cache] = initCache(new Map())

// TODO: 
const slowConnection = false

export const defaultConfig: SWRConfig = mergeObjects(
  {
    // event
    onLoadingSlow: noop,
    onSuccess: noop,
    onError: noop,
    onErrorRetry,
    onDiscarded: noop,

    // switches
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    revalidateIfStale: true,
    shouldRetryOnError: true,

    // timeouts
    errorRetryInterval: slowConnection ? 10000 : 5000,
    focusThrottleInterval: 5 * 1000,
    dedupingInterval: 2 * 1000,
    loadingTimeout: slowConnection ? 5000 : 3000,

    // providers
    compare: (a: any | undefined, b: any | undefined) => a === b,
    isPaused: () => false,
    cache,
    mutate: noop,
    fallback: {}
  },
  {
    isOnline: () => true,
    isVisible: () => true
  }
)
