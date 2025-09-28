import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginForm from '@/pages/auth/index.vue'
import Dashboard from '@/pages/dashboard/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/login', component: LoginForm, meta: { guest: true } },
  ],
})

router.beforeEach((to, _, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.token) {
    return next('/login')
  }
  if (to.meta.guest && auth.token) {
    return next('/')
  }

  next()
})

export default router
