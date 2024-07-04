import { shallowRef, ref, getCurrentScope, watchEffect } from "vue";
import type { Fetcher, Key, Options, SWRResponse } from "./types";
import { normalizeArgs, serialize } from "./_internal";

export function useSWR<Data = any, Error = any>(key: Key): SWRResponse<Data, Error>
export function useSWR<Data = any, Error = any>(key: Key, fetcher: Fetcher<Data> | null): SWRResponse<Data, Error>
export function useSWR<Data = any, Error = any>(key: Key, options: Partial<Options<Data, Error>>): SWRResponse<Data, Error>
export function useSWR<Data = any, Error = any>(key: Key, fetcher: Fetcher<Data> | null, options: Partial<Options<Data, Error>>): SWRResponse<Data, Error>
export function useSWR<Data = any, Error = any>(..._args: any[]): SWRResponse<Data, Error> {
  if (!getCurrentScope()) {
    throw new Error('useSWR() can only be used inside setup()')
  }


  const [_key, fn, _config] = normalizeArgs<Data, Error>(..._args)
  const [key, args] = serialize(_key)
  const data = shallowRef()
  const error = shallowRef()
  const isLoading = ref(false)

  watchEffect(() => {
    console.log([key, args, fn])
    fetch(key)
  })


  return {
    data,
    error,
    isLoading,
    async mutate(data: Data) {
      return await Promise.resolve(data)
    }
  }
}
