import { createStore } from '../vuex'

function customPlugin(store) {
    let local = localStorage.getItem('VUEX:STATE')
    if (local) {
        store.replaceState(JSON.parse(local))
    } else {
        store.subscribe((mutation, state) => {
            localStorage.setItem('VUEX:STATE', JSON.stringify(state))
        })
    }

}

export default createStore({
    plugins: [
        customPlugin
    ],
    //strict: true,
    state: {
        count: 0
    },
    getters: {
        double(state) {
            return state.count * 2
        }
    },
    mutations: {
        add(state, payload) {
            state.count += payload
        }
    },
    actions: {
        asyncAdd({ commit }, payload) {
            setTimeout(() => {
                commit('add', payload)
            }, 1000)
        }
    },
    modules: {
        aCount: {
            namespaced: true,
            state: { count: 0 },
            mutations: {
                add(state, payload) {
                    state.count += payload
                }
            },
            modules: {
                cCount: {
                    namespaced: true,
                    state: { count: 0 },
                    mutations: {
                        add(state, payload) {
                            state.count += payload
                        }
                    }
                }
            }
        }
    }
})