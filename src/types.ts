import type { Ref, WatchSource } from 'vue'
import type * as revalidateEvents from './_internal/events'

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
export type Key = Arguments | WatchSource<Arguments>

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

export interface Options<Data = any, Error = any> {
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
  onLoadingSlow: (key: string, config: Readonly<Options<Data, Error>>) => void
  onSuccess: (data: Data, key: string, config: Readonly<Options<Data, Error>>) => void
  onError: (err: Error, key: string, config: Readonly<Options<Data, Error>>) => void
  onErrorRetry: (err: Error, key: string, config: Readonly<Options<Data, Error>>, revalidate: Revalidator, revalidateOpts: Required<RevalidatorOptions>) => void
  onDiscarded: (key: string) => void

  isVisible: () => boolean
  isOnline: () => boolean
}

export interface Cache<Data> {
  get(key: string): Data | undefined
  set(key: string, value: Data): void
  delete(key: string): void
  keys(): IterableIterator<string>
}

export interface SWRHook {
  <Data = any, Error = any>(key: Key): SWRResponse<Data, Error>
  <Data = any, Error = any>(key: Key, fetcher: Fetcher<Data> | null): SWRResponse<Data, Error>
  <Data = any, Error = any>(key: Key, options: Partial<Options<Data, Error>>): SWRResponse<Data, Error>
  <Data = any, Error = any>(key: Key, fetcher: Fetcher<Data> | null, options: Partial<Options<Data, Error>>): SWRResponse<Data, Error>
}


export type RevalidateEvent =
  | typeof revalidateEvents.FOCUS_EVENT
  | typeof revalidateEvents.RECONNECT_EVENT
  | typeof revalidateEvents.MUTATE_EVENT
  | typeof revalidateEvents.ERROR_REVALIDATE_EVENT
type RevalidateCallbackReturnType = {
  [revalidateEvents.FOCUS_EVENT]: void
  [revalidateEvents.RECONNECT_EVENT]: void
  [revalidateEvents.MUTATE_EVENT]: Promise<boolean>
  [revalidateEvents.ERROR_REVALIDATE_EVENT]: void
}
export type RevalidateCallback = <K extends RevalidateEvent>(
  type: K,
  opts?: any
) => RevalidateCallbackReturnType[K]
