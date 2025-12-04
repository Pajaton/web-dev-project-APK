import { createRouter, createWebHistory } from 'vue-router'

import Home from './views/Home.vue'
import APK from './views/APK.vue'

const routes = [
  { path: '/home', name: 'home', component: Home },
  { path: '/drinks', name: 'drinks', component: APK }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
