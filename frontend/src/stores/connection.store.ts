import { defineStore } from 'pinia';
import { ref } from 'vue';

import { socket } from '@/core/websocket';

export enum ConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected'
}

/**
 * Handle WebSocket connection state and events.
 */
export const useConnectionStore = defineStore('connection', () => {
  const state = ref<ConnectionState>(ConnectionState.Disconnected);

  /**
   * Connect to WebSocket server if not already connected/connecting.
   */
  async function connect(): Promise<void> {
    if ([ConnectionState.Connected, ConnectionState.Connecting].includes(state.value)) {
      console.log(`Websocket already in ${state.value} state`);
      return;
    }
    state.value = ConnectionState.Connecting;
    socket.connect();
  }

  /**
   * Disconnect from WebSocket server.
   */
  function disconnect(): void {
    socket.disconnect();
  }

  /**
   * Bind WebSocket events.
   */
  function bindEvents(): void {
    socket.on('connect', () => {
      state.value = ConnectionState.Connected;
    });

    socket.on('disconnect', () => {
      state.value = ConnectionState.Disconnected;
    });
  }

  return { state, connect, disconnect, bindEvents };
});
