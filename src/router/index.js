import { createRouter, createWebHistory } from 'vue-router';
import PrivateChat from '@/views/PrivateChat.vue';
import GoogleLogin from '@/views/GoogleLogin.vue';
import { useAuthStore } from '@/store';

const routes = [
  {
    path: "/",
    name: 'Home',
    component: PrivateChat,
    meta: { requiresAuth: true }
  },
  {
    path: "/login",
    name: 'Login-Page',
    component: GoogleLogin
  }
];
const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.token) {
    return next("/login");
  }

  if (to.path === "/login" && authStore.token) {
    return next("/");
  }
  next();
});

export default router;