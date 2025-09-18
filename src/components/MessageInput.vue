<template>
  <div class="border-t p-3">
    <div v-if="!showVoiceRecorder" class="relative">
      <input
        v-model="message"
        @keyup.enter="sendMessage"
        type="text"
        class="w-full pr-20 text-sm focus:outline-none"
        placeholder="Type a message"
        :disabled="!selectedChat"
      />
      <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
        <button
          @click="toggleVoiceRecorder"
          class="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600"
          :disabled="!selectedChat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2zm5.3 6c0 3-2.54 5.1-5.3 5.1S6.7 11 6.7 8H5c0 3.41 2.72 6.23 6 6.72V17h2v-2.28c3.28-.49 6-3.31 6-6.72h-1.7z"/>
          </svg>
        </button>
        <button
          class="bg-sky-600 hover:bg-sky-700 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          @click="sendMessage"
          :disabled="!selectedChat || !message.trim()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor"
            viewBox="0 0 24 24">
            <path d="M3 20v-6l8-2l-8-2V4l19 8z"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-else class="flex items-center gap-2">
      <button
        @click="toggleVoiceRecorder"
        class="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
      <div class="flex-1">
        <VoiceRecorder
          :selectedChat="selectedChat"
          @send-voice-message="handleVoiceMessage"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import VoiceRecorder from './VoiceRecorder.vue';

defineProps({
  selectedChat: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['send-message', 'send-voice-message']);

const message = ref('');
const showVoiceRecorder = ref(false);

function sendMessage() {
  if (!message.value.trim()) return;

  emit('send-message', message.value.trim());
  message.value = '';
}

function toggleVoiceRecorder() {
  showVoiceRecorder.value = !showVoiceRecorder.value;
}

function handleVoiceMessage(voiceData) {
  emit('send-voice-message', voiceData);
  showVoiceRecorder.value = false;
}
</script>