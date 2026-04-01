import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import DeveloperList from '@/views/developerlist.vue'
import Dashboard from '@/views/Dashboard.vue'
import Listings from '@/views/Listings.vue'
import Accounting from '@/views/Accounting.vue'
import GenealogyLandingpage from '@/views/Genealogy-landingpage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Landing',
    component: Dashboard,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
  },
  {
    path: '/developerlist',
    name: 'DeveloperList',
    component: DeveloperList
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
  {
    path: '/genealogy',
    name: 'Genealogy',
    component: GenealogyLandingpage
  },
  

]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
