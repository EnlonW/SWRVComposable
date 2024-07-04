import { defineComponent } from "vue";
import useSWR from "swr"

export const App = defineComponent({
  setup() {
    const { data, error, } = useSWR(['/api',1])
    return () => (
      <div>
        <h1>Hello, world!</h1>
      </div>
    )
  }
})
