import type { Ref, WatchSource } from 'vue'

export type State<Data = any, Error = any> = {
  data?: Data
  error?: Error
  isValidating?: boolean
  isLoading?: boolean
}

type ArgumentsTuple = readonly [any, ...unknown[]]
export type Arguments =
  | string
  | ArgumentsTuple
  | Record<any, any>
  | null
  | undefined
  | false
export type SWRKey = Arguments | WatchSource<Arguments>

export type Fetcher<Data> = (...args: any) => Data | Promise<Data>

export type SWRResponse<Data = any, Error = any> = {
  data: Ref<Data | undefined>
  error: Ref<Error | undefined>
  isValidating: Ref<boolean>
  isLoading: Ref<boolean>
  mutate: (data: Data) => Promise<Data>
}

export interface RevalidatorOptions {
  retryCount?: number
  dedupe?: boolean
}

export type Revalidator = (revalidateOpts?: RevalidatorOptions | undefined) => void | Promise<boolean>

export interface PrivateConfiguration {
  cache: Cache<any>
}

export interface PublicConfiguration<Data = any, Error = any> {
  fetcher?: Fetcher<Data>,
  /**
   * @defaultValue true
   */
  revalidateIfStale: boolean
  revalidateOnMount?: boolean
  /**
   * @defaultValue true
   */
  revalidateOnFocus: boolean
  /**
   * @defaultValue true
   */
  revalidateOnReconnect: boolean
  /**
   * @defaultValue 0
   */
  refreshInterval: number | ((latestData: Data | undefined) => number)
  /**
   * @defaultValue false
   */
  refreshWhenHidden: boolean
  refreshWhenOffline?: boolean
  /**
   * @defaultValue false
   */
  shouldRetryOnError: boolean | ((err: Error) => boolean)
  /**
   * @defaultValue 5000
   */
  dedupingInterval: number
  /**
   * @defaultValue 5000
   */
  focusThrottleInterval: number
  /**
   * @defaultValue 3000
   */
  loadingTimeout: number
  /**
   * @defaultValue 5000
   */
  errorRetryInterval: number
  errorRetryCount?: number
  fallback: { [key: string]: any }
  fallbackData?: Data | Promise<Data>
  /**
   * @defaultValue false
   */
  keepPreviousData: boolean
  onLoadingSlow: (key: string, config: Readonly<SWRConfig<Data, Error>>) => void
  onSuccess: (data: Data, key: string, config: Readonly<SWRConfig<Data, Error>>) => void
  onError: (err: Error, key: string, config: Readonly<SWRConfig<Data, Error>>) => void
  onErrorRetry: (err: Error, key: string, config: Readonly<SWRConfig<Data, Error>>, revalidate: Revalidator, revalidateOpts: Required<RevalidatorOptions>) => void
  onDiscarded: (key: string) => void
  compare: (a: Data | undefined, b: Data | undefined) => boolean

  isVisible: () => boolean
  isOnline: () => boolean
}

export type SWRConfig<Data = any, Error = any> = PublicConfiguration<Data, Error> & {
  provider?: (cache: Readonly<Cache>) => Cache
}

export interface Cache<Data = any> {
  keys(): IterableIterator<string>
  get(key: string): State<Data> | undefined
  set(key: string, value: State<Data>): void
  delete(key: string): void
}

export interface SWRHook {
  <Data = any, Error = any>(key: SWRKey): SWRResponse<Data, Error>
  <Data = any, Error = any>(key: SWRKey, fetcher: Fetcher<Data> | null): SWRResponse<Data, Error>
  <Data = any, Error = any>(key: SWRKey, options: Partial<PublicConfiguration<Data, Error>>): SWRResponse<Data, Error>
  <Data = any, Error = any>(key: SWRKey, fetcher: Fetcher<Data> | null, options: Partial<PublicConfiguration<Data, Error>>): SWRResponse<Data, Error>
}
