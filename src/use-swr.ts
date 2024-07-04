import { shallowRef, ref, getCurrentScope, onMounted } from "vue";
import type { Fetcher, Key as SWRKey, Options as SWRConfig, SWRHook, SWRResponse, RevalidatorOptions, State, RevalidateCallback } from "./types";
import { isFunction, isUndefined, serialize, UNDEFINED, withArgs } from "./_internal";
import { getTimestamp } from "./_internal/timestamp";

import * as revalidateEvents from './_internal/events'

const FETCH: Record<string, [any, number]> = {}
const MUTATION: Record<string, [number, number]> = {}
const EVENT_REVALIDATORS: Record<string, RevalidateCallback[]> = {}

const compare = (a: any, b: any) => a === b



export function useSWRHandler<Data = any, Error = any>(_key: SWRKey, fetcher: Fetcher<Data> | null, config: SWRConfig<Data, Error>): SWRResponse<Data, Error> {
  if (!getCurrentScope()) {
    throw new Error('useSWR() can only be used inside setup()')
  }
  const [key, fnArg] = serialize(_key)
  const data = shallowRef()
  const error = shallowRef()
  const isLoading = ref(false)
  const isValidating = ref(false)

  const getConfig = () => config

  const setCache = <Data, Error>(state: State<Data, Error>) => state

  const getCache = (): State<Data, Error> => ({ data: undefined })

  const isActive = () => getConfig().isVisible() && getConfig().isOnline()

  const revalidate = async (revalidateOpts?: RevalidatorOptions): Promise<boolean> => {
    const currentFetcher = fetcher

    if (!key || !currentFetcher) return false

    let newData: Data
    let startAt: number
    let loading = true
    const opts = revalidateOpts || {}

    const shouldStartNewRequest = !FETCH[key] || !opts.dedupe

    const callbackSafeguard = () => key === key

    const finalState: State<Data, Error> = {
      isValidating: false,
      isLoading: false
    }
    const finishRequestAndUpdateState = () => {
      setCache(finalState)
    }

    const cleanupState = () => {
      const requestInfo = FETCH[key]
      if (requestInfo && requestInfo[1] === startAt) {
        delete FETCH[key]
      }
    }

    const initialState: State<Data, Error> = { isValidating: true }

    if (isUndefined(getCache().data)) {
      initialState.isLoading = true
    }

    try {
      if (shouldStartNewRequest) {
        setCache(initialState)
        if (config.loadingTimeout && isUndefined(getCache().data)) {
          setTimeout(() => {
            if (loading && callbackSafeguard()) {
              getConfig().onLoadingSlow(key, config)
            }
          }, config.loadingTimeout);
        }

        FETCH[key] = [
          currentFetcher(fnArg),
          getTimestamp()
        ]
      }
      ;[newData, startAt] = FETCH[key]
      newData = await newData

      if (shouldStartNewRequest) {
        setTimeout(cleanupState, config.dedupingInterval)
      }

      if (!FETCH[key] || FETCH[key][1] !== startAt) {
        if (shouldStartNewRequest) {
          if (callbackSafeguard()) {
            getConfig().onDiscarded(key)
          }
        }
        return false
      }

      finalState.error = UNDEFINED

      const mutationInfo = MUTATION[key]
      if (
        !isUndefined(mutationInfo) &&
        (startAt <= mutationInfo[0] ||
          startAt <= mutationInfo[1] ||
          mutationInfo[1] === 0)
      ) {
        finishRequestAndUpdateState()
        if (shouldStartNewRequest) {
          if (callbackSafeguard()) {
            getConfig().onDiscarded(key)
          }
        }
        return false
      }

      const cacheData = getCache().data

      finalState.data = compare(cacheData, newData) ? cacheData : newData

      if (shouldStartNewRequest) {
        if (callbackSafeguard()) {
          getConfig().onSuccess(newData, key, config)
        }
      }
    } catch (err: any) {
      cleanupState()

      const currentConfig = getConfig()
      const { shouldRetryOnError } = currentConfig

      finalState.error = err as Error

      if (shouldStartNewRequest && callbackSafeguard()) {
        currentConfig.onError(err, key, currentConfig)
        if (
          shouldRetryOnError === true ||
          (isFunction(shouldRetryOnError) &&
            shouldRetryOnError(err as Error))
        ) {
          if (
            !getConfig().revalidateOnFocus ||
            !getConfig().revalidateOnReconnect ||
            isActive()
          ) {
            // If it's inactive, stop. It will auto-revalidate when
            // refocusing or reconnecting.
            // When retrying, deduplication is always enabled.
            currentConfig.onErrorRetry(
              err,
              key,
              currentConfig,
              _opts => {
                const revalidators = EVENT_REVALIDATORS[key]
                if (revalidators && revalidators[0]) {
                  revalidators[0](
                    revalidateEvents.ERROR_REVALIDATE_EVENT,
                    _opts
                  )
                }
              },
              {
                retryCount: (opts.retryCount || 0) + 1,
                dedupe: true
              }
            )
          }
        }
      }
    }
    loading = false
    finishRequestAndUpdateState()
    return true
  }

  onMounted(() => {
    revalidate()
  })


  return {
    data,
    error,
    isLoading,
    isValidating,
    async mutate(data: Data) {
      return await Promise.resolve(data)
    }
  }
}

const useSWR = withArgs<SWRHook>(useSWRHandler)

export default useSWR
