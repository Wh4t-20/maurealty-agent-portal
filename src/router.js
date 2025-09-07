import { createRouter, createWebHistory } from 'vue-router';
import LoginForm from './components/login-form.vue';

const routes = [
{
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'LoginForm',
    component: LoginForm,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;