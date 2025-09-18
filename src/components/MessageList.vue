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
        <div class="relative flex items-end gap-1 group" :class="msg.userId === currentUserId ? 'flex-row-reverse' : 'flex-row'">
          <div
            :data-message-id="msg.id"
            :class="
              msg.userId === currentUserId
                ? 'bg-sky-600 text-white'
                : 'bg-gray-200 text-gray-700'
            "
            class="rounded-2xl px-3 py-2 max-w-xs text-sm relative"
            @contextmenu="handleContextMenu($event, msg)"
            @touchstart="handleTouchStart($event, msg)"
            @touchend="handleTouchEnd"
          >
          <div v-if="msg.type === 'voice'" class="voice-message">
            <div class="flex items-center gap-2">
              <button
                @click="playVoiceMessage(msg)"
                class="p-1 rounded-full"
                :class="
                  msg.userId === currentUserId
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-300 text-gray-600'
                "
              >
                <svg v-if="!msg.isPlaying" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              </button>

              <div class="flex-1 flex items-center gap-2">
                <div class="flex items-center gap-1">
                  <div v-for="n in 20" :key="n" class="w-0.5 h-3 rounded-full" :class="
                    msg.userId === currentUserId
                      ? 'bg-white/40'
                      : 'bg-gray-400'
                  "></div>
                </div>
                <span class="text-xs" :class="
                  msg.userId === currentUserId
                    ? 'text-white/80'
                    : 'text-gray-500'
                ">
                  {{ formatVoiceDuration(msg.duration) }}
                </span>
              </div>
            </div>
          </div>
          <p v-else @click="toggleTimeDisplay(msg.id)" class="cursor-pointer">
            <span v-if="msg.deletedForEveryone" class="italic text-gray-500">This message was deleted</span>
            <span v-else-if="msg.deletedForMe" class="italic text-gray-500">You deleted this message</span>
            <span v-else>{{ msg.message }}</span>
          </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop Popup Backdrop -->
    <div
      v-if="showPopup"
      class="fixed inset-0 z-40"
      @click="closePopup"
    ></div>

    <!-- Desktop Popup - Main Menu -->
    <div
      v-if="showPopup && popupLevel === 'main'"
      :style="{ top: popupY + 'px', left: popupX + 'px' }"
      class="fixed z-50 bg-white shadow-xl rounded-lg border py-2 min-w-40"
      @click.stop
    >
      <button
        @click="copyMessage(popupMessage)"
        class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-gray-700 transition-colors"
      >
        Copy
      </button>
      <button
        @click="showDeleteOptions"
        class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600 transition-colors"
      >
        Delete
      </button>
    </div>

    <!-- Desktop Popup - Delete Options -->
    <div
      v-if="showPopup && popupLevel === 'delete'"
      :style="{ top: popupY + 'px', left: popupX + 'px' }"
      class="fixed z-50 bg-white shadow-xl rounded-lg border py-2 min-w-40"
      @click.stop
    >
      <button
        @click="showDeleteConfirmation(popupMessage, 'me')"
        class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-gray-700 transition-colors"
      >
        Delete for me
      </button>
      <button
        v-if="popupMessage?.userId === currentUserId"
        @click="showDeleteConfirmation(popupMessage, 'everyone')"
        class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600 transition-colors"
      >
        Delete for everyone
      </button>
    </div>

    <!-- Mobile Context Menu -->
    <div
      v-if="contextMenu.show"
      class="fixed inset-0 z-40"
      @click="closeContextMenu"
    ></div>

    <div
      v-if="contextMenu.show"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      class="fixed z-50 bg-white shadow-xl rounded-lg border py-2 min-w-48"
      @click.stop
    >
      <button
        @click="copyMessage(contextMenu.message)"
        class="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 text-gray-700 transition-colors"
      >
        Copy
      </button>
      <button
        @click="showDeleteConfirmation(contextMenu.message, 'me')"
        class="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 text-gray-700 transition-colors"
      >
        Delete for me
      </button>
      <button
        v-if="contextMenu.message?.userId === currentUserId"
        @click="showDeleteConfirmation(contextMenu.message, 'everyone')"
        class="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 text-red-600 transition-colors"
      >
        Delete for everyone
      </button>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="deleteConfirmation.show"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click="closeDeleteConfirmation"
    >
      <div class="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-screen overflow-y-auto mx-auto shadow-xl" @click.stop>
        <h3 class="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Delete Message</h3>
        <p class="text-gray-600 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 leading-relaxed">
          {{ deleteConfirmation.type === 'everyone'
              ? 'This message will be deleted for everyone in the chat.'
              : 'This message will be deleted for you only.' }}
        </p>
        <div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <button
            @click="closeDeleteConfirmation"
            class="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 lg:py-3 text-gray-600 hover:bg-gray-100 rounded text-sm sm:text-base lg:text-lg font-medium"
          >
            Cancel
          </button>
          <button
            @click="confirmDelete"
            class="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 lg:py-3 bg-red-600 hover:bg-red-700 text-white rounded text-sm sm:text-base lg:text-lg font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onUnmounted } from 'vue';
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

const emit = defineEmits(['delete-message']);

const messagesContainer = ref(null);
const expandedTimes = ref(new Set());
const showPopup = ref(false);
const popupMessage = ref(null);
const popupX = ref(0);
const popupY = ref(0);
const popupLevel = ref('main'); // 'main' or 'delete'

const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  message: null
});
const deleteConfirmation = ref({
  show: false,
  message: null,
  type: null
});

let touchTimer = null;

function toggleTimeDisplay(messageId) {
  if (expandedTimes.value.has(messageId)) {
    expandedTimes.value.delete(messageId);
  } else {
    expandedTimes.value.add(messageId);
  }
}

function playVoiceMessage(message) {
  if (message.isPlaying) {
    // Pause the audio
    if (message.audioElement) {
      message.audioElement.pause();
    }
    message.isPlaying = false;
  } else {
    // Stop all other playing messages
    props.messages.forEach(msg => {
      if (msg.type === 'voice' && msg.isPlaying && msg.audioElement) {
        msg.audioElement.pause();
        msg.isPlaying = false;
      }
    });

    // Play this message
    if (!message.audioElement && message.audioURL) {
      message.audioElement = new Audio(message.audioURL);
      message.audioElement.addEventListener('ended', () => {
        message.isPlaying = false;
      });
    }

    if (message.audioElement) {
      message.audioElement.play();
      message.isPlaying = true;
    }
  }
}

function formatVoiceDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function handleContextMenu(event, message) {
  event.preventDefault();

  // Don't show context menu for already deleted messages
  if (message.deletedForEveryone || message.deletedForMe) return;

  // Only show context menu on mobile (right-click disabled on desktop)
  if (window.innerWidth >= 640) return; // sm breakpoint

  // Get the message bubble element
  const messageElement = event.currentTarget;
  const rect = messageElement.getBoundingClientRect();

  // Position menu below the message bubble
  showContextMenu(rect.left, rect.bottom + 5, message);
}

function handleTouchStart(event, message) {
  // Don't show context menu for already deleted messages
  if (message.deletedForEveryone || message.deletedForMe) return;

  const messageElement = event.currentTarget;

  touchTimer = setTimeout(() => {
    // Check if element still exists
    if (messageElement && messageElement.getBoundingClientRect) {
      const rect = messageElement.getBoundingClientRect();
      // Position menu below the message bubble
      showContextMenu(rect.left, rect.bottom + 5, message);
    }
  }, 500); // 500ms long press
}

function handleTouchEnd() {
  if (touchTimer) {
    clearTimeout(touchTimer);
    touchTimer = null;
  }
}

function showContextMenu(x, y, message) {
  // Adjust position to ensure menu stays on screen
  const menuWidth = 200;
  const menuHeight = 120;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let adjustedX = x;
  let adjustedY = y;

  // Keep menu on screen
  if (x + menuWidth > windowWidth - 10) {
    adjustedX = windowWidth - menuWidth - 10;
  }
  if (y + menuHeight > windowHeight - 10) {
    adjustedY = y - menuHeight - 10;
  }

  adjustedX = Math.max(10, adjustedX);
  adjustedY = Math.max(10, adjustedY);

  contextMenu.value = {
    show: true,
    x: adjustedX,
    y: adjustedY,
    message: message
  };
}

function closeContextMenu() {
  contextMenu.value.show = false;
}

function closePopup() {
  showPopup.value = false;
  popupLevel.value = 'main';
}

function copyMessage(message) {
  // Handle different message types
  let textToCopy = '';
  if (message.deletedForEveryone) {
    textToCopy = 'This message was deleted';
  } else if (message.deletedForMe) {
    textToCopy = 'You deleted this message';
  } else if (message.type === 'voice') {
    textToCopy = 'Voice message';
  } else {
    textToCopy = message.message;
  }

  // Copy to clipboard
  navigator.clipboard.writeText(textToCopy).then(() => {
    // Could add a toast notification here
    console.log('Message copied to clipboard');
  }).catch(err => {
    console.error('Failed to copy message:', err);
  });

  closeContextMenu();
  closePopup();
}

function showDeleteOptions() {
  popupLevel.value = 'delete';
}

function showDeleteConfirmation(message, type) {
  closeContextMenu();
  closePopup();
  deleteConfirmation.value = {
    show: true,
    message: message,
    type: type
  };
}

function closeDeleteConfirmation() {
  deleteConfirmation.value.show = false;
}

function confirmDelete() {
  const { message, type } = deleteConfirmation.value;
  emit('delete-message', { message, type });
  closeDeleteConfirmation();
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

// Cleanup on unmount
onUnmounted(() => {
  if (touchTimer) {
    clearTimeout(touchTimer);
    touchTimer = null;
  }
});

defineExpose({
  scrollToBottom
});
</script>