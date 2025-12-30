import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import DeveloperList from '@/views/developerlist.vue'
import Dashboard from '@/views/Dashboard.vue'
import Listings from '@/views/Listings.vue'
import Accounting from '@/views/Accounting.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Landing',
    component: DeveloperList,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/listings',
    name: 'Listing',
    component: Listings
  },
  {
    path: '/accounting',
    name: 'Accounting',
    component: Accounting
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
