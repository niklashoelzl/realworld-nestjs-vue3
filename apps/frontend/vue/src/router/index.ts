/**
 * src/router/index.ts
 *
 * Definiert alle Routen der Vue Applikation und richtet den
 * Vue Router mit HTML5 History Modus ein.
 *
 * Routen mit `meta.requiresAuth: true` sind nur für eingeloggte
 * Nutzer zugänglich. Der Navigation Guard leitet nicht authentifizierte
 * Nutzer auf die Login Seite um und bereits eingeloggte Nutzer
 * vom Login weg zur Startseite.
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore';
import HomeView from '@/views/HomeView.vue'
import AboutView from '@/views/AboutView.vue'
import ArticleDetailView from '@/views/ArticleDetailView.vue'
import Login from '@/views/Login.vue';
import SignUp from '@/views/SignUp.vue';
import ProfileView from '@/views/ProfileView.vue';
import CreateArticleView from '@/views/CreateArticleView.vue';
import EditArticleView from '@/views/EditArticleView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: false }
    },
    {
      path: '/articles/:slug',
      name: 'article-detail',
      component: ArticleDetailView,
      meta: { requiresAuth: false }
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
      meta: { requiresAuth: false }
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { requiresAuth: false }
    },
    {
      path: '/SignUp',
      name: 'SignUp',
      component: SignUp,
      meta: { requiresAuth: false }
    },
    {
      path: '/profile/:username?',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true }
    },
    {
      path: '/articles/new',
      name: 'article-create',
      component: CreateArticleView,
      meta: { requiresAuth: true }
    },
    {
      path: '/articles/:slug/edit',
      name: 'article-edit',
      component: EditArticleView,
      meta: { requiresAuth: true }
    },
  ],
})

/**
 * Globaler Navigation Guard.
 * Prüft vor jeder Navigation, ob die Zielroute eine Authentifizierung erfordert.
 * Nicht eingeloggte Nutzer werden auf `/login` umgeleitet,
 * wobei die ursprüngliche Ziel URL als `redirect` Query Parameter übergeben wird.
 * Bereits eingeloggte Nutzer werden von der Login Seite zur Startseite weitergeleitet.
 */
router.beforeEach((to, from) => {
  const authStore = useAuthStore();
  const requiresAuth = to.meta.requiresAuth;

  if (requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  } else if (!requiresAuth && to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'home' };
  }

  return true;
});

export default router;
