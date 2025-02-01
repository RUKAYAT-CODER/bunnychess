import { defineStore } from 'pinia';

import { socket } from '@/core/websocket';
import { ref } from 'vue';
import { useAuthStore } from './auth.store';
import { useGameStore } from './game.store';

interface AccountStatusUpdate {
  status: string;
  gameType?: string;
  ranked?: boolean;
  gameId?: string;
}

interface QueueSizes {
  [key: string]: {
    normal: number;
    ranked: number;
  };
}

/**
 * Handle matchmaking state and events.
 */
export const useMatchmakingStore = defineStore('matchmaking', () => {
  const authStore = useAuthStore();
  const gameStore = useGameStore();

  const searchingQueue = ref<string | undefined>(undefined);
  const gameIsReady = ref<boolean>(false);
  const lastEloChange = ref<number | undefined>(undefined);
  const queueSizes = ref<QueueSizes>({});

  /**
   * Join a matchmaking queue.
   *
   * @param gameType what type of game to join
   * @param ranked whether the game should be ranked
   */
  async function joinQueue(gameType: string, ranked: boolean): Promise<void> {
    if (searchingQueue.value) {
      console.log(`Already in ${searchingQueue.value} queue`);
      return;
    }
    try {
      searchingQueue.value = ranked ? 'ranked' : 'normal';
      await socket.emitWithAck('matchmaking:add-to-queue', {
        gameType,
        ranked
      });
    } catch (err) {
      searchingQueue.value = undefined;
      console.error('Could not join queue', err);
    }
  }

  /**
   * Leave current matchmaking queue.
   */
  async function leaveQueue(): Promise<void> {
    if (!searchingQueue.value) {
      console.log('Not in queue');
      return;
    }
    try {
      await socket.emitWithAck('matchmaking:remove-from-queue');
      searchingQueue.value = undefined;
    } catch (err) {
      console.error('Could not leave queue', err);
    }
  }

  /**
   * Join lobby room.
   */
  function joinLobby() {
    socket.emit('matchmaking:join-lobby');
  }

  /**
   * Leave lobby room.
   */
  function leaveLobby() {
    socket.emit('matchmaking:leave-lobby');
  }

  /**
   * Reset queue sizes.
   */
  function resetQueueSizes() {
    queueSizes.value = {};
  }

  /**
   * Bind WebSocket events.
   */
  function bindEvents(): void {
    socket.on('matchmaking:pending-game-ready', async (data) => {
      gameIsReady.value = true;
      try {
        await socket.emitWithAck('matchmaking:accept-pending-game', {
          pendingGameId: data.pendingGameId
        });
      } catch (err) {
        console.error('Could not accept pending game', err);
      }
    });

    socket.on('matchmaking:pending-game-timeout', async () => {
      searchingQueue.value = undefined;
      gameIsReady.value = false;
      console.log('Timeout: one or more players did not accept the game');
    });

    socket.on('matchmaking:account-status-update', async (data: AccountStatusUpdate) => {
      if (data.status === 'playing' && data.gameId) {
        await gameStore.joinGame(data.gameId);
      }
      if (data.status === 'searching' && data.gameType) {
        searchingQueue.value = data.ranked ? 'ranked' : 'normal';
      }
    });

    socket.on('matchmaking:elo-change', async (data) => {
      authStore.account.mmr = data.newElo;
      lastEloChange.value = data.eloChange;
    });

    socket.on('matchmaking:queue-sizes', async (data) => {
      queueSizes.value = data;
    });

    socket.on('game:game-start', async () => {
      searchingQueue.value = undefined;
      gameIsReady.value = false;
    });
  }

  return {
    searchingQueue,
    gameIsReady,
    lastEloChange,
    joinQueue,
    bindEvents,
    leaveQueue,
    joinLobby,
    leaveLobby,
    queueSizes,
    resetQueueSizes
  };
});
