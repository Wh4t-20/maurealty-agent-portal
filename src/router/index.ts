// src/router/index.ts
// Every route of the portal, the sign-in guard, and how page code is loaded.
//
// Pages are loaded on demand: each view is its own chunk, downloaded the first time it is opened.
// (Before, every page and its libraries - Mapbox, Vue Flow, jsPDF - came in one 3 MB bundle, even
// for the login page.) Once a signed-in page has rendered, the other portal pages are fetched in
// the background (prefetchPortalPages), so moving between pages stays instant.
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { supabase } from '@/supabaseClient'

// --- Page loaders (one chunk per page) ---
const Login = () => import('@/views/LoginForm.vue')
const SharedListing = () => import('@/views/SharedListing.vue')
const Dashboard = () => import('@/views/Dashboard.vue')
const DeveloperList = () => import('@/views/developerlist.vue')
const Listings = () => import('@/views/Listings.vue')
const PropertyManagement = () => import('@/views/PropertyManagement.vue')
const Accounting = () => import('@/views/Accounting.vue')
const SalesReport = () => import('@/views/SalesReport.vue')
const GenealogyLandingpage = () => import('@/views/Genealogy-landingpage.vue')
const Profile = () => import('@/views/Profile.vue')
const Settings = () => import('@/views/Settings.vue')
const Commission = () => import('@/views/Commission.vue')
const Support = () => import('@/views/Support.vue')

// Pages a signed-in agent can open from the Sidebar (prefetched after the first one renders).
const PORTAL_PAGES = [
  Dashboard, Listings, SalesReport, Commission, Support, DeveloperList,
  PropertyManagement, GenealogyLandingpage, Accounting, Profile, Settings,
]

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
    meta: { requiresAuth: true }
  },
  {
    path: '/developerlist',
    name: 'DeveloperList',
    component: DeveloperList,
    meta: { requiresAuth: true }
  },
  {
    path: '/listings',
    name: 'Listing',
    component: Listings,
    meta: { requiresAuth: true }
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
    meta: { requiresAuth: true }
  },
  {
    path: '/accounting',
    name: 'Accounting',
    component: Accounting,
    meta: { requiresAuth: true }
  },
  {
    path: '/sales',
    name: 'SalesReport',
    component: SalesReport,
    meta: { requiresAuth: true }
  },
  {
    path: '/genealogy',
    name: 'Genealogy',
    component: GenealogyLandingpage,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true }
  },
  {
  path: '/commissions',
  name: 'Commission',
  component: Commission,
  // Signed-out visitors go to the login page, like every other page (this route had no meta).
  meta: { requiresAuth: true }
  },
  {
    // IT support tickets: everyone raises tickets; admins (IT support) review and resolve them.
    path: '/support',
    name: 'Support',
    component: Support,
    meta: { requiresAuth: true }
  }
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

// --- Background prefetch of the portal pages ---
// After the first signed-in page has rendered, download the other portal pages while the browser
// is idle. Signed-out visitors (login page, shared listing links) never download the portal.
// A failed prefetch is ignored: that page is simply fetched again when it is opened.
let portalPagesPrefetched = false
function prefetchPortalPages() {
  if (portalPagesPrefetched) return
  portalPagesPrefetched = true
  const run = () => PORTAL_PAGES.forEach(load => load().catch(() => {}))
  // Wait a moment so the page that was just opened gets the network first.
  setTimeout(() => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 5000 })
    else run()
  }, 2000)
}
router.afterEach((to, _from, failure) => {
  if (!failure && to.meta.requiresAuth) prefetchPortalPages()
})

// --- Recovering from a deploy ---
// A tab left open across a deploy still asks for the old page files, which no longer exist, so
// opening a page fails with "Failed to fetch dynamically imported module". Load that page fresh
// (full reload) once; if it fails again within 10 s, stop, so a real outage can't loop.
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|Unable to preload CSS/i
const RELOAD_KEY = 'mau_chunk_reload_at'
router.onError((error, to) => {
  if (!CHUNK_ERROR.test(String(error?.message ?? error))) return
  let lastReload = 0
  try { lastReload = Number(sessionStorage.getItem(RELOAD_KEY)) || 0 } catch { /* storage blocked */ }
  if (Date.now() - lastReload < 10_000) return
  try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())) } catch { /* storage blocked */ }
  window.location.assign(router.resolve(to.fullPath).href) // href includes the app's base path
})

export default router
