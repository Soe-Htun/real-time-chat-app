<template>
  <div class="relative">
    <img
      :class="avatarClasses"
      :src="user?.photoURL || 'https://ptetutorials.com/images/user-profile.png'"
      :alt="user?.displayName || 'user'"
    />
    <div
      v-if="showOnlineStatus && isOnline"
      class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"
    ></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  size: {
    type: String,
    default: 'md', // sm, md, lg
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  showOnlineStatus: {
    type: Boolean,
    default: true
  },
  isOnline: {
    type: Boolean,
    default: false
  }
});

const avatarClasses = computed(() => {
  const baseClasses = 'rounded-full object-cover';
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };
  return `${baseClasses} ${sizeClasses[props.size]}`;
});
</script>