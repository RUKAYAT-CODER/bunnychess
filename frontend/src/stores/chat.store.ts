import { defineStore } from 'pinia';
import { ref } from 'vue';

import { socket } from '@/core/websocket';
import { useAuthStore } from './auth.store';

export interface ChatMessage {
  username: string;
  message: string;
  id: string;
  mine: boolean;
}

/**
 * Provide chat functionality.
 */
export const useChatStore = defineStore('chat', () => {
  const authStore = useAuthStore();

  const messages = ref<ChatMessage[]>([]);

  /**
   * Send a chat message to the game room.
   *
   * @param message message content to send
   * @param gameId game room id
   */
  async function sendGameChatMessage(message: string, gameId: string): Promise<void> {
    socket.emit('chat:send-message', { message, gameId });
  }

  /**
   * Clear all chat messages.
   */
  function $reset(): void {
    messages.value = [];
  }

  /**
   * Bind WebSocket events.
   */
  function bindEvents(): void {
    socket.on('chat:message', (chatMessage: { username: string; message: string; id: string }) => {
      messages.value.push({
        ...chatMessage,
        mine: authStore.account.username === chatMessage.username
      });
    });
  }

  return { messages, sendGameChatMessage, bindEvents, $reset };
});
