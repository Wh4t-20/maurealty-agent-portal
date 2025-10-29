import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/components/test.vue' 

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'test',
      component: Home,
    },
  ],
})

export default router
