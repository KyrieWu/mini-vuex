import Module from './module'
import { forEachValue } from '../utils'

export default class ModuleCollection {
    constructor(rootModule) {
        this.register(rootModule, [])
    }

    get(path) {
        return path.reduce((module, key) => {
            return module.getChild(key)
        }, this.root)
    }

    register(rawModule, path) {
        const newModle = new Module(rawModule)
        if (path.length == 0) {
            this.root = newModle
        } else {
            const parent = this.get(path.slice(0, -1))
            parent.addChild(path[path.length - 1], newModle)

        }

        if (rawModule.modules) {
            forEachValue(rawModule.modules, (rawChildModule, key) => {
                this.register(rawChildModule, path.concat(key))
            })
        }
    }

    getNamespaced(path) {
        let module = this.root
        return path.reduce((namespace, key) => {
            module = module.getChild(key)
            return namespace + (module.namespaced ? key + '/' : '')
        }, '')
    }
}