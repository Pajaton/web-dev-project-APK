import { createRouter, createWebHistory } from 'vue-router'

import Home from './views/Home.vue'
import FindSystembolag from './views/FindSystembolag.vue'

const routes = [
  { path: '/home', name: 'home', component: Home },
  { path: '/systembolag', name: 'findSystembolag', component: FindSystembolag }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
