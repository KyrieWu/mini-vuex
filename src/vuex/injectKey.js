import {inject} from 'vue'
// vue 内部已经将这些 api 导出来了
export const storeKey = 'store'
export function useStore(injectKey = null) {
    return inject(injectKey !== null ? injectKey : storeKey)
}