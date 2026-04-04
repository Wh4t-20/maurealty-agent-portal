import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Test from '@/components/developerlist.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Landing',
    component: Test,
  },
  
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
