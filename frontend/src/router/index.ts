import { useAuthStore } from '@/stores/auth.store';
import { useConnectionStore } from '@/stores/connection.store';
import { useGameStore } from '@/stores/game.store';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import '../assets/main.css';
import GameView from '../views/GameView.vue';
import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import PrivacyPolicyView from '../views/PrivacyPolicyView.vue';
import RegisterView from '../views/RegisterView.vue';
import TermsOfServiceView from '../views/TermsOfServiceView.vue';

const routes: Array<RouteRecordRaw> = [
  { path: '/', component: HomeView, meta: { requireUser: true } },
  {
    path: '/game',
    component: GameView,
    // Only allow access to /game route if a game is in progress
    beforeEnter: (_to, _from) => {
      if (!useGameStore().game?.id) {
        return '/';
      }
    }
  },
  { path: '/login', component: LoginView, meta: { requireAnonymous: true } },
  { path: '/register', component: RegisterView, meta: { requireAnonymous: true } },
  { path: '/privacy', component: PrivacyPolicyView },
  { path: '/tos', component: TermsOfServiceView },
  { path: '/:pathMatch(.*)', redirect: '/login' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  const connectionStore = useConnectionStore();

  await authStore.fetchAccount();
  const isLoggedIn = authStore.account.isLoggedIn;

  if (isLoggedIn) {
    connectionStore.connect();
  }

  if (to.meta.requireAnonymous && isLoggedIn) {
    next({ path: '/' });
    return;
  }

  if (to.meta.requireUser && !isLoggedIn) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    });
    return;
  }

  next();
});

export default router;
