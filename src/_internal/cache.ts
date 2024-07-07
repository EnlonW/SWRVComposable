import type { Cache, State } from "../types";

export type GlobalState = [
  Record<string, [any, number]>, // FETCH
  (key: string, value: any, prev: any) => void, // Setter
  (key: string, callback: (current: any, prev: any) => void) => () => void // Subscriber
]

export const SWRGlobalState = new WeakMap<Cache, GlobalState>();

export const initCache = <Data = any>(provider: Cache<Data>) => {
  const subscriptions: Record<string, ((current: any, prev: any) => void)[]> = {};

  const FETCH = {}

  const subscriber = (key: string, callback: (current: any, prev: any) => void) => {
    const subs = subscriptions[key] || [];
    subscriptions[key] = subs;

    subs.push(callback);
    return () => subs.splice(subs.indexOf(callback), 1);
  };

  const setter = (key: string, value: any, prev: any) => {
    provider.set(key, value);
    const subs = subscriptions[key];
    if (subs) {
      subs.forEach(callback => callback(value, prev));
    }
  };


  const initProvider = () => {
    SWRGlobalState.set(provider, [
      FETCH,
      setter,
      subscriber
    ]);
  }

  initProvider()
  return [provider]
}

export const createCacheHelper = <Data = any, T extends State<Data, any> = State<Data, any>>(cache: Cache<Data>, key: string): [
  () => T,
  (info: T) => void
] => {
  const state = SWRGlobalState.get(cache) as GlobalState
  return [
    () => {
      return cache.get(key) as T;
    },
    (info: T) => {
      const prev = cache.get(key);
      state[1](key, info, prev);
    }
  ]
}
