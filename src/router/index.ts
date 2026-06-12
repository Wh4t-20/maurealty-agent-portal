import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { supabase } from '@/supabaseClient'
import DeveloperList from '@/views/developerlist.vue'
import Dashboard from '@/views/Dashboard.vue'
import Listings from '@/views/Listings.vue'
import PropertyManagement from '@/views/PropertyManagement.vue'
import Accounting from '@/views/Accounting.vue'
import Login from '@/views/LoginForm.vue'
import GenealogyLandingpage from '@/views/Genealogy-landingpage.vue'
import Profile from '@/components/Profile.vue'
import SharedListing from '@/views/SharedListing.vue'


const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Landing',
    component: Login,
    // This flag tells App.vue NOT to show the sidebar here
    meta: { hideSidebar: true, requiresAuth: false } 
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true}
  },
  {
    path: '/developerlist',
    name: 'DeveloperList',
    component: DeveloperList,
    meta: { requiresAuth: true}
  },
  {
    path: '/listings',
    name: 'Listing',
    component: Listings,
    meta: { requiresAuth: true}
  },
  {
    path: '/shared/listing/:token',
    name: 'SharedListing',
    component: SharedListing,
    meta: { requiresAuth: false, hideSidebar: true } // keeping this public to share to clients
  },
  {
    path: '/propertymanagement',
    name: 'PropertyManagement',
    component: PropertyManagement,
    meta: { requiresAuth: true}
  },
  {
    path: '/accounting',
    name: 'Accounting',
    component: Accounting,
    meta: { requiresAuth: true}
  },
  {
    path: '/genealogy',
    name: 'Genealogy',
    component: GenealogyLandingpage,
    meta: { requiresAuth: true}
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true}
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router