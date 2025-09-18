<template>
  <div class="relative">
    <div class="relative flex items-center">
      <svg class="absolute left-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
      <input
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        type="text"
        class="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
        :placeholder="placeholder"
      />
      <button
        v-if="modelValue"
        @click="$emit('update:modelValue', '')"
        class="absolute right-3 w-4 h-4 text-gray-400 hover:text-gray-600"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <!-- Search Results -->
    <div
      v-if="modelValue && filteredUsers.length"
      class="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border z-10 max-h-60 overflow-y-auto"
    >
      <div class="p-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
        People
      </div>
      <div
        v-for="user in filteredUsers"
        :key="user.uid"
        @click="$emit('select-user', user)"
        class="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <UserAvatar :user="user" size="md" :is-online="isUserOnline(user)" />
        <div class="flex-1">
          <div class="font-medium text-gray-900">{{ user.displayName }}</div>
          <div class="text-sm" :class="isUserOnline(user) ? 'text-green-600' : 'text-gray-500'">
            {{ getUserStatus(user) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import UserAvatar from './UserAvatar.vue';

defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Search Messenger'
  },
  filteredUsers: {
    type: Array,
    default: () => []
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

defineEmits(['update:modelValue', 'select-user']);
</script>