import { Store } from './store'
import { useStore } from "./injectKey"

//一个容器

function createStore(options) {
    return new Store(options)
}

export {
    createStore,
    useStore
}

