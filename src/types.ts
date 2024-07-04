import type { Ref } from 'vue'
import type { WatchSource } from 'vue/dist/vue.js'


export type State<Data = any, Error = any> = {
  data?: Ref<Data | undefined>
  error?: Ref<Error | undefined>
  isValidating?: Ref<boolean>
  isLoading?: Ref<boolean>
}

export type SWRResponse<Data = any, Error = any> = State<Data, Error> & {
  mutate: (data: Data) => Promise<Data>
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

export interface RevalidatorOptions {
  retryCount?: number
  dedupe?: boolean
}

type Revalidator = (revalidateOpts?: RevalidatorOptions | undefined) => void | Promise<boolean>

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
  fallbackData?: Data | Promise<Data>
  /**
   * @defaultValue false
   */
  keepPreviousData: boolean
  onLoadingSlow?: (key: string, config: Readonly<Options<Data, Error>>) => void
  onSuccess?: (data: Data, key: string, config: Readonly<Options<Data, Error>>) => void
  onError?: (err: Error, key: string, config: Readonly<Options<Data, Error>>) => void
  onErrorRetry?: (err: Error, key: string, config: Readonly<Options<Data, Error>>, revalidate: Revalidator, revalidateOpts: Required<RevalidatorOptions>) => void
  onDiscarded?: (key: string) => void
}


