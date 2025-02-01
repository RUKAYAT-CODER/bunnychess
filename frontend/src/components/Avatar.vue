<script setup lang="ts">
import { computed } from 'vue';

export interface Props {
  string: string;
}

const props = defineProps<Props>();

const AVATARS_COUNT = 32;

// Randomly pick an avatar based on string prop
const avatarUrl = computed<string>(() => {
  if (props.string === 'ai') {
    return 'avatars/ai.png';
  }
  let hash = 0;
  for (let i = 0; i < props.string.length; i++) {
    hash = (hash << 5) - hash + props.string.charCodeAt(i);
    hash |= 0;
  }
  const number = Math.abs(hash % AVATARS_COUNT) + 1;
  return `avatars/${number}.png`;
});
</script>

<template>
  <img class="h-full rounded-full bg-blue-900" :src="avatarUrl" />
</template>
