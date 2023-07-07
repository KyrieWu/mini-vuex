import { reactive, watch } from 'vue'
import { storeKey } from './injectKey'
import ModuleCollection from './module/module-collect'
import { forEachValue, isPromise } from './utils'


function getNestedState(state, path) { // 根据路径获取 store 上的最新状态
    return path.reduce((state, key) => state[key], state)
}

function installModule(store, rootState, path, module) {
    let isRoot = !path.length // 如果数组是空数组，说明时根，否则不是

    const namespaced = store._modules.getNamespaced(path)

    if (!isRoot) {
        let parentState = path.slice(0, -1).reduce((state, key) => state[key], rootState)
        parentState[path[path.length - 1]] = module.state
    }
    // getters
    module.forEachGetter((getter, key) => {
        store._wrappedGetters[namespaced + key] = () => {
            return getter(getNestedState(store.state, path))   // 如果直接使用模块上自己的状态，此状态不是响应式的
        }
    })

    // mutation
    module.forEachMutation((mutation, key) => {
        const entry = store._mutations[namespaced + key] || (store._mutations[namespaced + key] = [])
        entry.push((payload) => {
            mutation.call(store, getNestedState(store.state, path), payload)
        })
    })

    // actions
    module.forEachAction((action, key) => {
        const entry = store._actions[namespaced + key] || (store._actions[namespaced + key] = [])
        entry.push((payload) => {
            let res = action.call(store, store, payload)
            if (!isPromise(res)) {
                return Promise.resolve(res)
            }

            return res
        })
    })

    module.forEachChild((child, key) => {
        installModule(store, rootState, path.concat(key), child)
    })
}

function resetStoreState(store, state) {
    store._state = reactive({ data: state })
    const wrappedGetters = store._wrappedGetters
    store.getters = {}
    forEachValue(wrappedGetters, (getter, key) => {
        Object.defineProperty(store.getters, key, {
            get: getter,
            enumerable: true
        })
    })

    if (store.strict) {
        enableStrictMode(store)
    }
}

function enableStrictMode(store) {
    watch(() => store._state.data, () => {
        console.assert(store._committing, 'do not mutate vuex store state outside mutation handlers')
    }, { deep: true, flush: 'sync' })
}

export default class Store {
    constructor(options) {

        this._committing = false
        this._actions = Object.create(null)
        this._mutations = Object.create(null)
        this._wrappedGetters = Object.create(null)
        this._modules = new ModuleCollection(options)
        this._subscribers = []


        this.strict = options.strict || false

        // 定义状态
        const state = this._modules.root.state

        // init root module.
        // this also recursively registers all sub-modules
        // and collects all module getters inside this._wrappedGetters
        installModule(this, state, [], this._modules.root)
        resetStoreState(this, state)

        options.plugins.forEach(plugin => plugin(this))
    }

    get state() {
        return this._state.data
    }

    commit = (type, payload) => {
        const entry = this._mutations[type] || []
        this._withCommit(() => {
            entry && entry.forEach(handle => handle(payload))
        })
        this._subscribers.forEach(sub => sub({ type, payload }, this.state))

    }

    dispatch = (type, payload) => {
        const entry = this._actions[type] || []
        return Promise.all(entry.map(handle => handle(payload)))
    }

    subscribe(fn) {
        this._subscribers.push(fn)
    }

    replaceState(newState) {
        // 严格模式下 不能直接修改状态
        this._withCommit(() => {
            this._state.data = newState
        })
    }

    install(app, injectKey) {
        // 全局暴露一个变量 暴露的是store 的实例
        app.provide(injectKey || storeKey, this) // 给根app 增加一个——provides,子组件回去向上查找
        app.config.globalProperties.$store = this // 增添$store 属性
    }

    _withCommit(fn) {
        const commiting = this._committing
        this._committing = true
        fn()
        this._committing = commiting
    }
}

