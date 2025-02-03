import { socket } from '@/core/websocket';
import router from '@/router';
import { accountService } from '@/services/account.service';
import { authService } from '@/services/auth.service';
import { defineStore } from 'pinia';
import { ref } from 'vue';

interface Me {
  id: string;
  email: string;
  isAdmin: boolean;
  username: string;
  isLoggedIn: boolean | undefined;
  status: string;
  gameType?: string;
  gameId?: string;
  mmr: number;
}

const anonymousAccount: Readonly<Me> = Object.freeze({
  id: 'anonymous',
  email: '',
  isAdmin: false,
  username: '',
  isLoggedIn: undefined,
  status: 'undefined',
  mmr: 0
});

/**
 * Hold account data and provide authentication methods.
 */
export const useAuthStore = defineStore('auth', () => {
  const account = ref<Me>({
    ...anonymousAccount
  });

  /**
   * Execute login procedure.
   *
   * @param email user email
   * @param password user password
   */
  async function login(email: string, password: string): Promise<void> {
    await authService.login({ email, password });
    const accountData = await accountService.me();
    account.value = { ...accountData, isLoggedIn: true };
  }

  /**
   * Execute logout procedure.
   */
  async function logout(): Promise<void> {
    await authService.logout();
    socket.disconnect();
    account.value = { ...anonymousAccount, isLoggedIn: false };
  }

  /**
   * Register a new account with given credentials.
   *
   * @param email user email
   * @param username user username
   * @param password user password
   */
  async function register(email: string, username: string, password: string): Promise<void> {
    await authService.register({ email, username, password });
  }

  /**
   * Request account data from the server if not already fetched.
   */
  async function fetchAccount(): Promise<void> {
    if (account.value.isLoggedIn === undefined) {
      try {
        const accountData = await accountService.me();
        account.value = { ...accountData, isLoggedIn: true };
      } catch (err) {
        account.value = { ...anonymousAccount, isLoggedIn: false };
      }
    }
  }

  /**
   * Bind WebSocket events.
   */
  function bindEvents() {
    socket.on('socket:missing-jwt', async (data) => {
      console.error('Authentication error:', data.message);
      try {
        await authService.refresh();
      } catch (err) {
        await logout();
        router.push({ path: '/login' });
        return;
      }
      socket.disconnect();
      socket.connect();
    });
  }

  return { account, login, logout, register, fetchAccount, bindEvents };
});
