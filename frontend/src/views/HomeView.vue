<script setup lang="ts">
import Avatar from '@/components/Avatar.vue';
import ContainerWithTitle from '@/components/ContainerWithTitle.vue';
import PlayAgainstAi from '@/components/PlayAgainstAi.vue';
import Spinner from '@/components/Spinner.vue';
import router from '@/router';
import { useAuthStore } from '@/stores/auth.store';
import { useMatchmakingStore } from '@/stores/matchmaking.store';
import { computed, onMounted, onUnmounted, ref } from 'vue';

const authStore = useAuthStore();
const matchmakingStore = useMatchmakingStore();

onMounted(() => {
  matchmakingStore.resetQueueSizes();
  matchmakingStore.joinLobby();
});

onUnmounted(() => {
  matchmakingStore.leaveLobby();
});

const gameModes: [string, string][] = [
  ['10+0', 'Rapid'],
  ['5+3', 'Blitz'],
  ['5+0', 'Blitz'],
  ['3+2', 'Blitz'],
  ['3+0', 'Blitz'],
  ['1+0', 'Bullet']
];
const selectedMode = ref<string>(gameModes[0][0]);

const lastEloChange = computed<string | undefined>(() => {
  const eloChange = matchmakingStore.lastEloChange;
  return eloChange != null ? (eloChange >= 0 ? `+${eloChange}` : `${eloChange}`) : undefined;
});

const eloCategory = computed<string>(() => {
  const elo = authStore.account.mmr;
  if (elo < 1200) return 'Class E';
  if (elo < 1400) return 'Class D';
  if (elo < 1600) return 'Class C';
  if (elo < 1800) return 'Class B';
  if (elo < 2000) return 'Class A';
  if (elo < 2200) return 'Expert';
  if (elo < 2300) return 'Candidate Master';
  if (elo < 2400) return 'Master';
  if (elo < 2500) return 'International Master';
  if (elo < 2700) return 'Grandmaster';
  return 'Supergrandmaster';
});

async function logout(): Promise<void> {
  await authStore.logout();
  router.push({ path: '/login' });
}

async function joinQueue(gameType: string, ranked: boolean): Promise<void> {
  matchmakingStore.resetQueueSizes();
  await matchmakingStore.joinQueue(gameType, ranked);
}

async function leaveQueue(): Promise<void> {
  matchmakingStore.resetQueueSizes();
  await matchmakingStore.leaveQueue();
}
</script>

<template>
  <ContainerWithTitle>
    <div class="bg-blue-700 rounded shadow-lg px-4 pt-5 pb-4 sm:p-6 sm:pb-4 space-y-4 text-center">
      <div>
        <div class="flex justify-center h-32">
          <Avatar :string="authStore.account.id"></Avatar>
        </div>
        <div class="text-3xl break-all">
          🐰 <span v-if="authStore.account.isAdmin">⭐</span> {{ authStore.account.username }} 🐰
        </div>
        <div>
          Elo: {{ authStore.account.mmr }}
          <span
            v-if="lastEloChange"
            :class="{
              'text-green-400': matchmakingStore.lastEloChange! >= 0,
              'text-red-400': matchmakingStore.lastEloChange! < 0
            }"
            >({{ lastEloChange }})</span
          >
        </div>
        <div>{{ eloCategory }}</div>
      </div>
      <div v-show="matchmakingStore.searchingQueue">
        <div>{{ `Searching ${matchmakingStore.searchingQueue} ${selectedMode} match...` }}</div>
        <div v-if="matchmakingStore.gameIsReady">Game found!</div>
        <Spinner></Spinner>
        <div>
          <button v-if="!matchmakingStore.gameIsReady" class="m-auto" @click="leaveQueue()">
            Cancel
          </button>
        </div>
      </div>

      <div v-show="!matchmakingStore.searchingQueue" class="flex flex-col space-y-4">
        <div class="grid grid-cols-2 gap-2 justify-between">
          <div
            class="flex-1 p-1"
            v-for="[clockRules, gameTypeCategory] of gameModes"
            :key="`${clockRules}-${gameTypeCategory}`"
            :class="{
              'animated-border':
                matchmakingStore.queueSizes[clockRules]?.normal > 0 ||
                matchmakingStore.queueSizes[clockRules]?.ranked > 0,
              'normal-waiting':
                matchmakingStore.queueSizes[clockRules]?.normal > 0 &&
                matchmakingStore.queueSizes[clockRules]?.ranked === 0,
              'ranked-waiting':
                matchmakingStore.queueSizes[clockRules]?.ranked > 0 &&
                matchmakingStore.queueSizes[clockRules]?.normal === 0,
              'normal-and-ranked-waiting':
                matchmakingStore.queueSizes[clockRules]?.normal > 0 &&
                matchmakingStore.queueSizes[clockRules]?.ranked > 0
            }"
          >
            <button
              class="w-full"
              :class="{ 'bg-blue-900': selectedMode === clockRules }"
              @click="selectedMode = clockRules"
            >
              {{ clockRules }}<br />{{ gameTypeCategory }}
            </button>
          </div>
        </div>
        <div class="flex flex-col space-y-2">
          <button
            class="bg-green-500 disabled:bg-green-900 enabled:hover:bg-green-800 disabled:text-gray-500"
            @click="joinQueue(selectedMode, false)"
          >
            Online Normal
          </button>
          <button
            class="bg-red-500 disabled:bg-red-900 enabled:hover:bg-red-800 disabled:text-gray-500"
            @click="joinQueue(selectedMode, true)"
          >
            Online Ranked
          </button>
        </div>
        <PlayAgainstAi :game-type="selectedMode"></PlayAgainstAi>
        <button @click="logout()">Logout</button>
      </div>
    </div>
  </ContainerWithTitle>
</template>

<style scoped>
.animated-border {
  position: relative;
  overflow: hidden;
  z-index: 0;
  border-radius: 0.25rem;
}

.animated-border:before {
  content: '';
  z-index: -2;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(0deg);
  width: 400%;
  height: 400%;
  background-repeat: no-repeat;
  background-position: 0 0;
  animation:
    rotate 2s linear infinite,
    fadeIn 0.5s ease-in forwards;
}

.normal-waiting:before {
  background-image: conic-gradient(#00000000, #22c55eff, #22c55eff, #00000000);
}

.ranked-waiting:before {
  background-image: conic-gradient(#00000000, #ef4444ff, #ef4444ff, #00000000);
}

.normal-and-ranked-waiting:before {
  background-image: conic-gradient(#00000000, #22c55eff, #ef4444ff, #00000000);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes rotate {
  100% {
    transform: translate(-50%, -50%) rotate(1turn);
  }
}
</style>
