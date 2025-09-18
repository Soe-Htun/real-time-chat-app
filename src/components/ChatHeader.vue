<template>
  <div class="border-b px-4 py-3">
    <div class="flex items-center gap-x-2">
      <svg
        v-if="isMobile && selectedChat"
        @click="$emit('back')"
        xmlns="http://www.w3.org/2000/svg"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        class="cursor-pointer"
      >
        <path
          fill="#888888"
          d="M10 22L0 12L10 2l1.775 1.775L3.55 12l8.225 8.225z"
        />
      </svg>

      <UserAvatar v-if="selectedChat" :user="selectedChat" :is-online="isUserOnline(selectedChat)" :show-online-status="true" size="md" />

      <div v-if="selectedChat" class="flex flex-col">
        <h4 class="font-semibold text-gray-700">
          {{ selectedChat.displayName }}
        </h4>
        <p class="text-sm" :class="isUserOnline(selectedChat) ? 'text-green-600' : 'text-gray-500'">
          {{ getUserStatus(selectedChat) }}
        </p>
      </div>

      <h4 v-else class="font-semibold text-gray-700">
        Select a chat
      </h4>
    </div>
  </div>
</template>

<script setup>
import UserAvatar from './UserAvatar.vue';

defineProps({
  selectedChat: {
    type: Object,
    default: null
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  isUserOnline: {
    type: Function,
    default: () => false
  },
  getUserStatus: {
    type: Function,
    default: () => 'Offline'
  }
});

defineEmits(['back']);
</script>