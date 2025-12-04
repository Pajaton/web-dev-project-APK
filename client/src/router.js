import { createRouter, createWebHistory } from 'vue-router'

import Home from './views/Home.vue'
import APK from './views/APK.vue'
import Users from './views/Users.vue'
import UserProfile from './views/UserProfile.vue'

const routes = [
  { path: '/home', name: 'home', component: Home },
  { path: '/drinks', name: 'drinks', component: APK },
  { path: '/users', name: 'users', component: Users },
  { path: '/users/:id', name: 'userProfile', component: UserProfile, props: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
