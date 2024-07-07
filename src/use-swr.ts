
import { useEventListener, useTimeoutFn } from "@vueuse/core"
import { withArgs, serialize, isUndefined, UNDEFINED, mergeObjects, isFunction } from "./_internal"
import type { Fetcher, PrivateConfiguration, State, SWRConfig, SWRHook, SWRKey, SWRResponse } from "./types"
import { computed, ref, toRef, toValue, watch, type MaybeRefOrGetter } from "vue"
import { useSyncExternalStore } from "./hooks/useSyncExternalStore"
import { createCacheHelper, SWRGlobalState, type GlobalState } from "./_internal/cache"

const WITH_DEDUPE = { dedupe: true }

export function useSWRHandler<Data = any, Error = any>(_key: MaybeRefOrGetter<SWRKey>, fetcher: Fetcher<Data> | null, config: SWRConfig<Data, Error> & PrivateConfiguration): SWRResponse<Data, Error> {
  const context = computed(() => {
    const [key, fnArgs] = serialize(toValue(_key))
    return {
      key,
      fnArgs,
      fetcher
    }
  })

  const state = computed(() => {
    const [FETCH, _, subscriber] = SWRGlobalState.get(config.cache) as GlobalState
    return {
      FETCH,
      subscriber
    }
  })
  const cacheFns = computed(() => {
    const [getCache, setCache] = createCacheHelper(config.cache, toValue(context.value.key))
    return {
      getCache,
      setCache
    }
  })
  const isActive = () => config.isVisible() && config.isOnline()

  const unmountedRef = ref(false)

  const getSnapshot = computed((): [() => Record<string, any>] => {
    const shouldStartRequest = (() => {
      if (!context.value.key) return false
      if (!fetcher) return false
      if (!isUndefined(config.revalidateOnMount)) return config.revalidateOnMount
      return config.revalidateIfStale !== false
    })()
    const getSelectedCache = (state: Record<string, any>) => {

      const snapshot = mergeObjects(state)

      if (!shouldStartRequest) {
        return snapshot
      }

      return {
        isValidating: true,
        isLoading: true,
        ...state,
      }
    }
    return [
      () => getSelectedCache(cacheFns.value.getCache())
    ]
  })

  const defaultValidatingState = computed(() => !!(toValue(_key) && fetcher))

  // cache state
  const cached = useSyncExternalStore<State<Data, Error>>(
    computed(() => (callback) => state.value.subscriber(context.value.key, (current: State<Data, any>, prev: State<Data, any>) => {
      if (JSON.stringify(prev) !== JSON.stringify(current)) callback()
    })),
    getSnapshot
  );
  const cachedData = computed(() => cached.value.data)

  const fallback = computed(() => isUndefined(config.fallbackData) ? isUndefined(config.fallback) ? UNDEFINED : config.fallback[context.value.key] : config.fallbackData)
  // state
  const data = computed<Data>(() => isUndefined(cachedData.value) ? fallback.value : cachedData.value)
  const error = computed<Error | undefined>(() => cached.value.error)
  const isValidating = computed(() => isUndefined(cached.value.isValidating) ? defaultValidatingState.value : cached.value.isValidating)
  const isLoading = computed(() => isUndefined(cached.value.isLoading) ? isValidating.value : cached.value.isLoading)

  const returnedData = computed(() => config.keepPreviousData ? isUndefined(cachedData.value) ? data.value : cachedData.value : data.value)

  const revalidate = async (revalidateOpts: { dedupe: boolean }) => {
    const { key, fnArgs, fetcher } = context.value

    // 如果没有key或者fetcher，直接返回false
    if (!key || !fetcher || unmountedRef.value) return false

    // 设置初始状态
    let newData: Data
    let startAt: number
    let loading = true

    // 判断是否需要发起新的请求
    const shouldStartNewRequest = !state.value.FETCH[key] || !revalidateOpts.dedupe

    // 判断当前的回调是否安全
    const isCallbackSafe = () => key === context.value.key

    // 清除fetch状态
    const cleanupState = () => {
      const fetchInfo = state.value.FETCH[key]
      if (fetchInfo && fetchInfo[1] === startAt) {
        delete state.value.FETCH[key]
      }
    }

    // 设置缓存
    const finishRequestAndUpdateState = () => {
      cacheFns.value.setCache(finalState)
    }

    const finalState: State<Data, Error> = {
      isValidating: false,
      isLoading: false
    }

    const initialState: State<Data, Error> = { isValidating: true }
    if (isUndefined(cacheFns.value.getCache()?.data)) {
      initialState.isLoading = true
    }
    try {
      if (shouldStartNewRequest) {
        cacheFns.value.setCache(initialState)

        if (config.loadingTimeout && isUndefined(cacheFns.value.getCache().data)) {
          useTimeoutFn(() => {
            if (loading && isCallbackSafe()) {
              config.onLoadingSlow(key, config)
            }
          }, config.loadingTimeout)
        }

        state.value.FETCH[key] = [fetcher(fnArgs), Date.now()]
      }

      [newData, startAt] = state.value.FETCH[key]
      newData = await newData

      if (shouldStartNewRequest) {
        useTimeoutFn(() => cleanupState(), config.dedupingInterval)
      }

      // Race Condition
      // FETCH
      if (!state.value.FETCH[key] || state.value.FETCH[key][1] !== startAt) {
        if (shouldStartNewRequest && isCallbackSafe()) {
          config.onDiscarded(key)
        }
        return false
      }
      finalState.error = UNDEFINED
      // TODO: MUTATION

      const cacheData = cacheFns.value.getCache().data

      finalState.data = JSON.stringify(cacheData) === JSON.stringify(newData) ? cacheData : newData

      if (shouldStartNewRequest && isCallbackSafe()) {
        config.onSuccess(newData, key, config)
      }

    } catch (error: any) {
      cleanupState()

      const currentConfig = config

      finalState.error = error as Error

      if (shouldStartNewRequest && isCallbackSafe()) {
        currentConfig.onError(error as Error, key, currentConfig)
        // TODO: shouldRetryOnError
      }
    }

    loading = false

    finishRequestAndUpdateState()

    return true
  }

  const shouldDoInitialRevalidation = computed(() => {
    if (!isUndefined(error.value)) return false

    if (!isUndefined(config.revalidateOnMount)) return config.revalidateOnMount

    return isUndefined(data.value) || config.revalidateIfStale
  })

  watch(
    toRef(_key),
    (key, __, onCleanup) => {
      if (!key) return

      const softRevalidate = revalidate.bind(UNDEFINED, WITH_DEDUPE)

      let nextFocusRevalidatedAt = 0

      const initFocus = () => {
        const now = Date.now()
        if (config.revalidateOnFocus && now > nextFocusRevalidatedAt && isActive()) {
          nextFocusRevalidatedAt = now + config.focusThrottleInterval
          softRevalidate()
        }
      }

      const initReconnect = () => {
        if (config.revalidateOnReconnect && isActive()) {
          softRevalidate()
        }
      }
      const STR_UNDEFINED = 'undefined'
      const tryWindow = typeof window != STR_UNDEFINED ? window : UNDEFINED
      const tryDocument = typeof document != STR_UNDEFINED ? document : UNDEFINED

      const unFocus = useEventListener(tryWindow, 'focus', initFocus)
      const unVisibilitychange = useEventListener(tryDocument, 'visibilitychange', initFocus)
      const unOnline = useEventListener(tryWindow, 'online', initReconnect)

      unmountedRef.value = false

      if (shouldDoInitialRevalidation) {
        if (isUndefined(data.value)) {
          softRevalidate()
        } else {
          useTimeoutFn(softRevalidate, 1)
        }
      }

      onCleanup(() => {
        unmountedRef.value = true
        unFocus()
        unVisibilitychange()
        unOnline()
      })
    },
    { immediate: true }
  )

  watch(
    [toRef(_key), toRef(config.refreshInterval), toRef(config.refreshWhenHidden), toRef(config.refreshWhenOffline)],
    (_, __, onCleanup) => {
      let timer: ReturnType<typeof setTimeout> | null

      const execute = () => {
        if (!cacheFns.value.getCache().error && (config.refreshWhenHidden || config.isVisible()) && (config.refreshWhenOffline || config.isOnline())) {
          revalidate(WITH_DEDUPE).then(next)
        } else {
          next()
        }
      }

      const next = () => {
        const interval = isFunction(config.refreshInterval)
          ? (config.refreshInterval)(cacheFns.value.getCache().data)
          : config.refreshInterval

        if (interval && timer !== null) {
          timer = setTimeout(execute, interval);
        }
      }

      next()

      onCleanup(() => {
        if (timer) {
          clearTimeout(timer)
          timer = null
        }
      })
    },
    { immediate: true }
  )

  return {
    data: returnedData,
    error,
    isValidating,
    isLoading,
    async mutate(data) {
      await revalidate(WITH_DEDUPE)
      return data as Data
    }
  }
}

const useSWR = withArgs<SWRHook>(useSWRHandler)

export default useSWR
