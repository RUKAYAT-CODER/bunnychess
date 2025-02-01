<script setup lang="ts">
import { AiSkillLevel } from '@/core/ai';
import { createGameAgainstAi } from '@/core/game';
import { useAuthStore } from '@/stores/auth.store';
import { useGameStore } from '@/stores/game.store';

export interface Props {
  gameType: string;
}

const props = defineProps<Props>();

const authStore = useAuthStore();
const gameStore = useGameStore();

const aiSkillLevels: [AiSkillLevel, string][] = [
  [AiSkillLevel.VeryEasy, '😇'],
  [AiSkillLevel.Easy, '🙂'],
  [AiSkillLevel.Medium, '😐'],
  [AiSkillLevel.Hard, '😬'],
  [AiSkillLevel.VeryHard, '😱']
];

async function joinLocalGame(gameType: string, skillLevel: AiSkillLevel): Promise<void> {
  const localGame = createGameAgainstAi({ gameType, skillLevel, accountId: authStore.account.id });
  await gameStore.joinGame(localGame);
}
</script>

<template>
  <div class="bg-blue-600 rounded">
    <div class="my-2">Play against AI</div>

    <div class="flex w-full">
      <button
        v-for="[skillLevel, icon] of aiSkillLevels"
        :key="skillLevel"
        class="flex-1 px-0 bg-blue-600 disabled:bg-blue-900 enabled:hover:bg-blue-800"
        @click="joinLocalGame(props.gameType, skillLevel)"
      >
        {{ icon }}
      </button>
    </div>
  </div>
</template>
