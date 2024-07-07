import { defineComponent } from "vue";
import useSWR from "swr"

export const App = defineComponent({
  setup() {
    const fetcher = (url: string) => fetch(url).then(res => res.json())
    const { data, error, isLoading } = useSWR('/api/user/123', fetcher)

    return {
      data,
      error,
      isLoading
    }
  },
  render() {
    if (this.error) return <div>failed to load</div>
    if (this.isLoading) return <div>loading...</div>
    return <div>hello {this.data.name}</div>
  }
})
