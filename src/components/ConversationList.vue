<template>
  <div class="flex-1 overflow-y-auto">
    <div
      v-for="conv in conversations"
      :key="conv.uid"
      @click="$emit('select-chat', conv)"
      class="flex items-center gap-3 border-b px-4 py-3 hover:bg-gray-100 cursor-pointer"
      :class="{ 'bg-gray-200': selectedChat?.uid === conv.uid }"
    >
      <UserAvatar :user="conv" :is-online="isUserOnline(conv.uid)" :show-online-status="true" size="md" />
      <div class="flex-1">
        <h5 class="flex justify-between text-sm font-medium text-gray-700">
          {{ conv.displayName }}
          <span class="text-xs text-gray-500">
            {{ formatLastMessageTime(conv.lastMessageTime) }}
          </span>
        </h5>
        <div class="flex justify-between items-center">
          <p class="text-xs text-gray-500 truncate flex-1 mr-2">
            {{ conv.lastMessage }}
          </p>
          <span class="text-xs" :class="isUserOnline(conv.uid) ? 'text-green-600' : 'text-gray-400'">
            {{ isUserOnline(conv.uid) ? '●' : '○' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import UserAvatar from './UserAvatar.vue';
import { formatLastMessageTime } from '@/constants';

defineProps({
  conversations: {
    type: Array,
    default: () => []
  },
  selectedChat: {
    type: Object,
    default: null
  },
  isUserOnline: {
    type: Function,
    required: true
  }
});

defineEmits(['select-chat']);
</script>