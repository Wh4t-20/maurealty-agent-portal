import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { supabase } from '@/supabaseClient'
import DeveloperList from '@/views/developerlist.vue'
import Dashboard from '@/views/Dashboard.vue'
import Listings from '@/views/Listings.vue'
import PropertyManagement from '@/views/PropertyManagement.vue'
import Accounting from '@/views/Accounting.vue'
import SalesReport from '@/views/SalesReport.vue'
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
    path: '/sales',
    name: 'SalesReport',
    component: SalesReport,
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

// Verify current session everytime the PATH changes
router.beforeEach(async (to,from, next) =>{
  
  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!session;

  // check if route being navigated through needs auth
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !isAuthenticated){
    next({ name: 'Landing' }); // block user
  } else if (to.name === 'Landing' && isAuthenticated){
    next({ name: 'Listing' }); // user is alerady logged in but trying to view login page
  } else {
    next();
  }
})

export default router