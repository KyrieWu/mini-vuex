import { storeKey } from './injectKey'
import ModuleCollection from './module/module-collect'

function installModule(store, rootState, path, module) {
    let isRoot = !path.length // 如果数组是空数组，说明时根，否则不是

    if (!isRoot) {
        let parentState = path.slice(0, -1).reduce((state, key) => state[key], rootState)
        parentState[path[path.length - 1]] = module.state
    }

    module.forEachChild((child, key) => {
        installModule(store, rootState, path.concat(key), child)
    })
}

export default class Store {
    constructor(options) {
        const store = this
        this._module = new ModuleCollection(options)

        // 定义状态
        const state = store._module.root.state

        // init root module.
        // this also recursively registers all sub-modules
        // and collects all module getters inside this._wrappedGetters
        installModule(store, state, [], store._module.root)
    }

    install(app, injectKey) {
        // 全局暴露一个变量 暴露的是store 的实例
        app.provide(injectKey || storeKey, this) // 给根app 增加一个——provides,子组件回去向上查找
        app.config.globalProperties.$store = this // 增添$store 属性
    }
}

// 格式化用户的参数，实现根据自己的需要，后续使用时方便
