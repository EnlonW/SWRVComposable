export const defineConfig = {
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
}
