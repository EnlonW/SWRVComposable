import { defineComponent, onMounted, ref, toValue } from "vue";
import useSWR from "swr"

export const App = defineComponent({
  setup() {
    const b = ref(1)
    const key = () => ['/api', b.value]
    const { data, error, } = useSWR(key)

    onMounted(() => {
      b.value = 2
    })
    return () => (
      <div>
        <h1>Hello, world!</h1>
      </div>
    )
  }
})
