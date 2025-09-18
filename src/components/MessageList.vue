<template>
  <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-3 msg_history">
    <div
      v-for="msg in messages"
      :key="msg.id"
      class="flex flex-col"
      :class="msg.userId === currentUserId ? 'items-end' : 'items-start'"
    >
      <div
        v-if="expandedTimes.has(msg.id)"
        class="mb-1 px-2 py-1 rounded-full text-xs text-gray cursor-pointer self-center"
        @click="toggleTimeDisplay(msg.id)"
      >
        {{ formatMessageTime(msg.createdAt) }}
      </div>
      <div class="flex gap-2" :class="msg.userId === currentUserId ? 'justify-end' : 'justify-start'">
        <div v-if="msg.userId !== currentUserId">
          <UserAvatar :user="selectedChat" size="sm" :show-online-status="false" />
        </div>
        <div
          :class="
            msg.userId === currentUserId
              ? 'bg-sky-600 text-white'
              : 'bg-gray-200 text-gray-700'
          "
          class="rounded-2xl px-3 py-2 max-w-xs text-sm"
        >
          <p @click="toggleTimeDisplay(msg.id)" class="cursor-pointer">{{ msg.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue';
import UserAvatar from './UserAvatar.vue';
import { formatMessageTime } from '@/constants.js';

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  selectedChat: {
    type: Object,
    default: null
  },
  currentUserId: {
    type: String,
    required: true
  }
});

const messagesContainer = ref(null);
const expandedTimes = ref(new Set());



function toggleTimeDisplay(messageId) {
  if (expandedTimes.value.has(messageId)) {
    expandedTimes.value.delete(messageId);
  } else {
    expandedTimes.value.add(messageId);
  }
}


function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

// Watch for new messages and scroll to bottom
watch(() => props.messages.length, () => {
  scrollToBottom();
}, { immediate: true });

defineExpose({
  scrollToBottom
});
</script>