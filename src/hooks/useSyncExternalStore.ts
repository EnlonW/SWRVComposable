import { computed, shallowRef, watchEffect, } from "vue";
import type { ComputedRef, Ref } from "vue";

type Subscribe = (callback: () => void) => () => void;
type GetSnapshots<T> = ComputedRef<[
  () => T,
  (() => T)?
]>;

const IS_SERVER = typeof window === "undefined";

export function useSyncExternalStore<T>(subscribe: ComputedRef<Subscribe>, getSnapshots: GetSnapshots<T>): Ref<T> {
  const getEffectiveSnapshot = computed(() => {
    const [getClientSnapshot, getServerSnapshot] = getSnapshots.value;
    return IS_SERVER && getServerSnapshot ? getServerSnapshot : getClientSnapshot;
  })

  const state = shallowRef<T>(getEffectiveSnapshot.value());

  watchEffect((onCleanup) => {
    const handleStateChange = () => {
      state.value = getEffectiveSnapshot.value()
    };
    const unsubscribe = subscribe.value(handleStateChange);

    onCleanup(() => {
      unsubscribe();
    });
  });

  return state;
}
