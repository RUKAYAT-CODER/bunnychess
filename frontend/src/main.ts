import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import './assets/index.css';
import { socket } from './core/websocket';
import router from './router';
import { useAuthStore } from './stores/auth.store';
import { useChatStore } from './stores/chat.store';
import { useConnectionStore } from './stores/connection.store';
import { useGameStore } from './stores/game.store';
import { useMatchmakingStore } from './stores/matchmaking.store';

const pinia = createPinia();
const app = createApp(App);

app.use(router);
app.use(pinia);

// Remove any existing listeners (e.g. after a hot module replacement)
socket.off();

// Bind all WebSocket events
useConnectionStore().bindEvents();
useAuthStore().bindEvents();
useMatchmakingStore().bindEvents();
useGameStore().bindEvents();
useChatStore().bindEvents();

app.mount('#app');
