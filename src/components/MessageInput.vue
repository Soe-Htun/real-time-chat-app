<template>
  <div class="border-t p-3 relative">
    <input
      v-model="message"
      @keyup.enter="sendMessage"
      type="text"
      class="w-full pr-10 text-sm focus:outline-none"
      placeholder="Type a message"
      :disabled="!selectedChat"
    />
    <button
      class="absolute right-4 top-1/2 -translate-y-1/2 bg-sky-600 hover:bg-sky-700 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
      type="button"
      @click="sendMessage"
      :disabled="!selectedChat || !message.trim()"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
        viewBox="0 0 24 24">
        <path d="M3 20v-6l8-2l-8-2V4l19 8z"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  selectedChat: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['send-message']);

const message = ref('');

function sendMessage() {
  if (!message.value.trim()) return;

  emit('send-message', message.value.trim());
  message.value = '';
}
</script>