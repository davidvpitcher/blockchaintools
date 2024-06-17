// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/views/HomePage.vue';
import AboutPage from '@/views/AboutPage.vue';
import ContactPage from '@/views/ContactPage.vue';
import Tool1Page from '@/views/Tool1Page.vue';
import Tool2Page from '@/views/Tool2Page.vue';
import Tool3Page from '@/views/Tool3Page.vue';
import LoginPage from '@/views/LoginPage.vue';
import AdminPage from '@/views/AdminPage.vue';
import AuthService from '@/services/AuthService';

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/about', name: 'about', component: AboutPage },
  { path: '/contact', name: 'contact', component: ContactPage },
  { path: '/tool1', name: 'tool1', component: Tool1Page, meta: { requiresAuth: true } },
  { path: '/tool2', name: 'tool2', component: Tool2Page, meta: { requiresAuth: true } },
  { path: '/tool3', name: 'tool3', component: Tool3Page, meta: { requiresAuth: true } },
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/admin', name: 'admin', component: AdminPage, meta: { requiresAuth: true, requiresAdmin: true } }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    AuthService.isAuthenticated().then(isAuthenticated => {
      if (isAuthenticated) {
        if (to.matched.some(record => record.meta.requiresAdmin)) {
          AuthService.getUserRole().then(role => {
            if (role === 'admin') {
              next();
            } else {
              next({ name: 'home' });
            }
          });
        } else {
          next();
        }
      } else {
        next({ name: 'login' });
      }
    });
  } else {
    next();
  }
});

export default router;
