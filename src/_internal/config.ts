import { isUndefined, mergeObjects, noop } from "./shared";
import type { Options, Revalidator, RevalidatorOptions } from "../types";

const onErrorRetry = (
  _: unknown,
  __: string,
  config: Readonly<Options>,
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

export const defaultConfig: Options = mergeObjects(
  {
    // event
    onLoadingSlow: noop,
    onSuccess: noop,
    onError: noop,
    onErrorRetry,
    onDiscarded: noop,

    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 0,
    refreshWhenHidden: false,
    shouldRetryOnError: true,
    dedupingInterval: 5000,
    focusThrottleInterval: 5000,
    loadingTimeout: 3000,
    errorRetryInterval: 5000,
    errorRetryCount: 3,
    keepPreviousData: false,
    fallback: {},
  },
  {
    isOnline: () => true,
    isVisible: () => true
  }
)
