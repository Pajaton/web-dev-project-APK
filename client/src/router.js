import { createRouter, createWebHistory } from 'vue-router'

import Home from './views/Home.vue'
import Login from './views/Login.vue'
import Register from './views/Register.vue'
import APK from './views/APK.vue'
import Users from './views/Users.vue'
import UserProfile from './views/UserProfile.vue'
import FindSystembolag from './views/FindSystembolag.vue'

const routes = [
  { path: '/home', name: 'home', component: Home },
  { path: '/drinks', name: 'drinks', component: APK },
  { path: '/users', name: 'users', component: Users },
  { path: '/users/:id', name: 'userProfile', component: UserProfile, props: true },
  { path: '/login', name: 'login', component: Login },
  { path: '/register', name: 'register', component: Register },
  { path: '/home', name: 'home', component: Home },
  { path: '/systembolag', name: 'findSystembolag', component: FindSystembolag }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
