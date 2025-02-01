<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

export interface Props {
  chatMessages: { username: string; message: string; id: string; mine: boolean }[];
}

export interface Emits {
  (e: 'sendMessage', message: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const messagesDiv = ref<HTMLDivElement | undefined>();
const chatInput = ref<string>('');

// Always scroll to the bottom when new messages are added
watch(
  () => props.chatMessages.length,
  () => {
    nextTick(() => {
      if (messagesDiv.value) {
        messagesDiv.value.scrollTop = messagesDiv.value.scrollHeight;
      }
    });
  },
  { immediate: true }
);

function onSend(): void {
  if (chatInput.value) {
    emit('sendMessage', chatInput.value);
    chatInput.value = '';
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col bg-blue-900 text-2xl rounded-xl relative max-h-full min-h-full">
    <div
      ref="messagesDiv"
      class="flex-1 border-b-2 border-blue-700 p-4 break-words break-word overflow-auto h-2"
    >
      <div
        v-for="chatMessage in props.chatMessages"
        :key="chatMessage.id"
        class="text-left"
        :class="{ 'text-gray-500': chatMessage.mine }"
      >
        >
        {{ chatMessage.message }}
      </div>
    </div>
    <div class="flex flex-row items-center justify-center">
      <input
        class="inline flex-1 text-left rounded-bl border-t-1 border-blue-700 p-4"
        type="text"
        v-model="chatInput"
        maxlength="255"
        @keyup.enter="onSend()"
      />
      <button class="h-11 rounded-none rounded-br" @click="onSend()">Send</button>
    </div>
  </div>
</template>
