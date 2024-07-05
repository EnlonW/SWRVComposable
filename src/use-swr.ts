import { shallowRef, ref, getCurrentScope, onMounted, watchEffect, watch, toValue, toRefs, reactive, computed, type MaybeRef } from "vue";
import type { Fetcher, SWRKey, SWRConfig, SWRHook, SWRResponse, RevalidatorOptions, State, Cache, PrivateConfiguration } from "./types";
import { isFunction, isUndefined, serialize, UNDEFINED, withArgs } from "./_internal";

const WITH_DEDUPE = { dedupe: true }


// TODO1：全局缓存，用于存储所有的缓存数据，广播所有订阅的 hooks
// TODO2: 存放FETCH,MUTATE,EVENTS
const createGlobalState = <Data = any>(cache: Cache<Data>) => {
  return []
}

export function useSWRHandler<Data = any, Error = any>(_key: SWRKey, fetcher: Fetcher<Data> | null, config: SWRConfig<Data, Error> & PrivateConfiguration): SWRResponse<Data, Error> {
  if (!getCurrentScope()) {
    throw new Error('useSWR() can only be used inside setup()')
  }

  const [] = createGlobalState(config.cache)

  const serializeKey = computed(() => serialize(toValue(_key)))

  let fallback = isUndefined(config.fallbackData) ? isUndefined(config.fallback) ? UNDEFINED : config.fallback[serializeKey.value[0]] : config.fallbackData

  const getConfig = () => config

  const revalidate = async (revalidateOpts?: RevalidatorOptions): Promise<boolean> => {
    if (revalidateOpts?.dedupe || !getConfig().cache) return Promise.resolve(false)
    return Promise.resolve(!!serializeKey.value[1] && !!fetcher)
  }

  const data = shallowRef()
  const error = shallowRef()

  watch([
    () => config.refreshInterval,
    () => config.refreshWhenHidden,
    () => config.refreshWhenOffline,
    serializeKey
  ], (_, __, onCleanup) => {
    let timer: any
    const next = () => {
      const interval = isFunction(config.refreshInterval) ? config.refreshInterval(data.value) : config.refreshInterval
      if (interval && timer !== -1) {
        timer = setTimeout(execute, interval)
      }
    }
    const execute = () => {
      if (!error.value && (config.refreshWhenHidden || getConfig().isVisible()) && (config.refreshWhenOffline || getConfig().isOnline())) {
        revalidate(WITH_DEDUPE).then(next)
      } else {
        next()
      }
    }

    next()
    onCleanup(() => {
      if (timer) {
        clearTimeout(timer)
        timer = -1
      }
    })
  }, { immediate: true })


  return {
    async mutate(data: Data) {
      return await Promise.resolve(data)
    }
  } as any
}

const useSWR = withArgs<SWRHook>(useSWRHandler)

export default useSWR
