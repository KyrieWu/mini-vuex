import { reactive } from 'vue'
import { forEachValue } from './utils'
import { storeKey } from './injectKey'
export class Store {
    constructor(options) {
        const store = this
        store._state = reactive({ data: options.state }) // new Vue

        const _getters = options.getters;

        // const computedObj = {}
        // const computedCache = {}
        store.getters = {}
        forEachValue(_getters, function (fn, key) {
            // use computed to leverage its lazy-caching mechanism
            // direct inline function use will lead to closure preserving oldState.
            // using partial to return function with only arguments preserved in closure environment.
            // computedObj[key] = partial(fn, store)
            // computedCache[key] =  computed(() => computedObj[key]())
            // Object.defineProperty(store.getters, key, {
            //     get: () => computedCache[key].value,
            //     enumerable: true
            // })
            Object.defineProperty(store.getters, key, {
                get: () => fn(store.state),
                enumerable: true
            })
        })

        store._mutations = Object.create(null)
        store._actions = Object.create(null)
        const _mutations = options.mutations
        const _actions = options.actions
        forEachValue(_mutations, (mutaiton, key) => {
            store._mutations[key] = (payload) => {
                mutaiton.call(store, store.state, payload)
            }
        })
        forEachValue(_actions, (action, key) => {
            store._actions[key] = (payload) => {
                action.call(store, store, payload)
            }
        })

    }

    commit = (type, payload) => {
        this._mutations[type](payload)
    }

    dispatch = (type, payload) => {
        this._actions[type](payload)
    }

    get state() { // 类的属性访问器
        return this._state.data
    }

    install(app, injectKey) {
        // 全局暴露一个变量 暴露的是store 的实例
        app.provide(injectKey || storeKey, this) // 给根app 增加一个——provides,子组件回去向上查找
        app.config.globalProperties.$store = this // 增添$store 属性
    }
}