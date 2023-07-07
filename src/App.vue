<template>
  <span>{{count}}{{$store.state.count}}</span>
  <button @click="$store.state.count++">add</button>
  <hr>
  double:{{double}}{{$store.getters.double}}

  <hr>
  <button @click="add">同步修改</button>
  <button @click="asyncAdd">异步修改</button>

  <hr>
  a模块:{{aCount}}
  c模块:{{cCount}}

  <button @click="$store.commit('aCount/add',1)">改a</button>
  <button @click="$store.commit('aCount/cCount/add',1)">改c</button>
</template>

<script setup>
import {computed} from 'vue'
import {useStore} from './vuex'

const store = useStore()

let count = computed(()=>store.state.count)
let double = computed(()=>store.getters.double)
let aCount = computed(()=>store.state.aCount.count)
let cCount = computed(()=>store.state.aCount.cCount.count)

function add(){
  store.commit('add',1)
}
function asyncAdd(){
  store.dispatch('asyncAdd',1)
}

</script>

<style lang="scss" scoped>

</style>