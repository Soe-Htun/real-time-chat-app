<template>
  <div class="max-w-6xl mx-auto h-screen flex flex-col">
    <div class="border rounded-lg shadow-sm overflow-hidden md:flex flex-1">
      <!-- Sidebar (conversation list) -->
      <div
        class="absolute md:static z-20 w-full md:w-2/5 h-full bg-gray-50 flex flex-col transition-transform duration-300 ease-in-out"
        :class="{ '-translate-x-full md:translate-x-0': !showSidebar }"
      >
        <!-- Header -->
        <div class="border-b px-4 py-3">
          <!-- Current User Section -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <UserAvatar :user="user" size="md" :show-online-status="false" />
              <div class="flex-1">
                <h4 class="font-semibold text-gray-900">{{ user?.displayName || 'User' }}</h4>
                <p class="text-sm text-green-600">Active now</p>
              </div>
            </div>
            <!-- Logout Button -->
            <button
              @click="logout"
              class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Logout"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
            </button>
          </div>

          <h4 class="text-sky-700 font-semibold text-lg mb-3">Chats</h4>

          <SearchInput
            v-model="search"
            :filtered-users="filteredUsers"
            :is-user-online="isUserOnlineHelper"
            :get-user-status="getUserStatusHelper"
            @select-user="handleSelectUser"
          />
        </div>

        <!-- Conversation list -->
        <ConversationList
          :conversations="conversations"
          :selected-chat="selectedChat"
          :is-user-online="isUserOnlineHelper"
          @select-chat="selectChat"
        />
      </div>

      <!-- Messages Section -->
      <div
        class="w-full md:w-3/5 flex flex-col h-full transition-transform duration-300 ease-in-out"
        :class="{
          '-translate-x-full md:translate-x-0': !selectedChat && isMobile,
          'translate-x-0': selectedChat || !isMobile,
        }"
      >
        <!-- Header -->
        <ChatHeader
          :selected-chat="selectedChat"
          :is-mobile="isMobile"
          :is-user-online="isUserOnlineHelper"
          :get-user-status="getUserStatusHelper"
          @back="handleBackToConversations"
        />

        <!-- Messages -->
        <MessageList
          ref="messageList"
          :messages="filteredMessages"
          :selected-chat="selectedChat"
          :current-user-id="user?.uid"
        />

        <!-- Input -->
        <MessageInput
          :selected-chat="selectedChat"
          @send-message="saveMessage"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted, watchEffect } from "vue";
import { db } from "@/main";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
} from "firebase/firestore";
import { useAuthStore } from "@/store";
import { storeToRefs } from "pinia";
import debounce from "lodash/debounce";
import { usePresence } from "@/composables/usePresence";

// Component imports
import UserAvatar from "@/components/UserAvatar.vue";
import SearchInput from "@/components/SearchInput.vue";
import ConversationList from "@/components/ConversationList.vue";
import ChatHeader from "@/components/ChatHeader.vue";
import MessageList from "@/components/MessageList.vue";
import MessageInput from "@/components/MessageInput.vue";

const store = useAuthStore();
const { user } = storeToRefs(store);

const messages = ref([]);
const users = ref([]);
const conversations = ref([]);
const selectedChat = ref(null);
const search = ref("");
const messageList = ref(null);

const showSidebar = ref(true);
const isMobile = ref(false);

// Initialize presence tracking
const {
  initPresence,
  checkUserOnline,
  getUserLastSeen,
  updateMyPresence
} = usePresence();

// Watch for user changes and reinitialize presence
watchEffect(() => {
  if (user.value?.uid) {
    initPresence(user.value.uid);
    updateMyPresence();
  }
});

// Helper functions for checking online status
function isUserOnlineHelper(userObjOrUid) {
  // Handle both user object and uid string
  const uid = typeof userObjOrUid === 'string' ? userObjOrUid : userObjOrUid?.uid;
  if (!uid) return false;
  const isOnline = checkUserOnline(uid);
  const displayName = typeof userObjOrUid === 'string' ? uid : (userObjOrUid?.displayName || uid);
  console.log(`Checking online status for ${displayName}: ${isOnline}`);
  return isOnline;
}

function getUserStatusHelper(userObj) {
  if (!userObj?.uid) return 'Active a while ago';

  const isOnline = checkUserOnline(userObj.uid);
  if (isOnline) return 'Active now';

  const lastSeen = getUserLastSeen(userObj.uid);
  if (!lastSeen) {
    // Check if user has lastActive in their profile data
    if (userObj.lastActive) {
      const lastActiveDate = userObj.lastActive.toDate ? userObj.lastActive.toDate() : new Date(userObj.lastActive);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastActiveDate) / (1000 * 60));

      if (diffMinutes < 1) return 'Active now';
      if (diffMinutes < 60) return `Active ${diffMinutes}m ago`;
      if (diffMinutes < 1440) return `Active ${Math.floor(diffMinutes / 60)}h ago`;
      return `Active ${Math.floor(diffMinutes / 1440)}d ago`;
    }
    return 'Active a while ago';
  }

  // Convert Firebase timestamp to readable format
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));

  if (diffMinutes < 1) return 'Active now';
  if (diffMinutes < 60) return `Active ${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `Active ${Math.floor(diffMinutes / 60)}h ago`;
  return `Active ${Math.floor(diffMinutes / 1440)}d ago`;
}

// Simple throttle function
function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

watchEffect(() => {
  if (!isMobile.value) return; // desktop: do nothing

  if (selectedChat.value) {
    showSidebar.value = false; // chat selected → hide sidebar
  } else {
    showSidebar.value = true; // no chat → show sidebar
  }
});

function handleResize() {
  isMobile.value = window.innerWidth < 768;
  if (!isMobile.value) showSidebar.value = true; // always show sidebar on desktop
}

// ------------------- FETCH MESSAGES -------------------
onMounted(() => {
  // Initialize presence tracking will happen in watchEffect when user is available

  const q = query(collection(db, "chat"), orderBy("createdAt", "asc"));
  onSnapshot(q, (snapshot) => {
    messages.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    buildConversations();
  });

  fetchUsers();

  handleResize();
  window.addEventListener("resize", handleResize);

  // Update user activity on mount and every 30 seconds
  updateUserActivity();
  updateMyPresence(); // Update Firebase presence
  const activityInterval = setInterval(() => {
    updateUserActivity();
    updateMyPresence();
  }, 30 * 1000);

  // Update activity on user interactions
  const activityEvents = ['click', 'keypress', 'mousemove', 'scroll'];
  const throttledUpdate = throttle(updateUserActivity, 30000); // Max once per 30 seconds

  activityEvents.forEach(event => {
    document.addEventListener(event, throttledUpdate);
  });

  // Cleanup on unmount
  onUnmounted(() => {
    clearInterval(activityInterval);
    activityEvents.forEach(event => {
      document.removeEventListener(event, throttledUpdate);
    });
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});


// ------------------- SAVE USER IF NEW -------------------
async function saveUserToFirestore(currentUser) {
  const userRef = doc(db, "users", currentUser.uid);
  await setDoc(
    userRef,
    {
      uid: currentUser.uid,
      displayName: currentUser.displayName,
      email: currentUser.email,
      photoURL: currentUser.photoURL || null,
      createdAt: new Date(),
      lastActive: new Date(),
    },
    { merge: true }
  );
}

// ------------------- FETCH USERS -------------------
async function fetchUsers() {
  if (!user.value) return;
  await saveUserToFirestore(user.value);

  onSnapshot(collection(db, "users"), (snapshot) => {
    users.value = snapshot.docs.map((doc) => doc.data());
    // Rebuild conversations when users data changes to update photoURLs
    if (messages.value.length > 0) {
      buildConversations();
    }
  });
}

function buildConversations() {
  const convs = [];

  // Only include messages where the logged-in user is sender or receiver
  const myMessages = messages.value.filter(
    (msg) => msg.userId === user.value.uid || msg.toUserId === user.value.uid
  );

  myMessages.forEach((msg) => {
    const partnerId = msg.userId === user.value.uid ? msg.toUserId : msg.userId;
    if (!partnerId) return;

    const existing = convs.find(c => c.uid === partnerId);
    // Get partner's photoURL from users collection
    const partnerUser = users.value.find(u => u.uid === partnerId);

    if (!existing) {
      convs.push({
        uid: partnerId,
        displayName: msg.userId === user.value.uid ? msg.toUserName : msg.userName,
        photoURL: partnerUser?.photoURL || null,
        lastActive: partnerUser?.lastActive || null,
        lastMessage: msg.message,
        lastMessageTime: msg.createdAt.toDate(),
      });
    } else {
      existing.lastMessage = msg.message;
      existing.lastMessageTime = msg.createdAt.toDate();
      // Update photoURL and lastActive if we have newer data
      if (partnerUser) {
        if (partnerUser.photoURL) existing.photoURL = partnerUser.photoURL;
        if (partnerUser.lastActive) existing.lastActive = partnerUser.lastActive;
      }
    }
  });

  conversations.value = convs.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
}

// ------------------- DEBOUNCED SEARCH -------------------
const debouncedSearch = ref(search.value);
watch(
  search,
  debounce((val) => {
    debouncedSearch.value = val;
  }, 300)
);

const filteredUsers = computed(() => {
  if (!debouncedSearch.value) return [];
  return users.value
    .filter((u) => u.uid !== user.value.uid)
    .filter((u) =>
      u.displayName
        .toLowerCase()
        .startsWith(debouncedSearch.value.toLowerCase())
    );
});

function selectChat(userItem) {
  selectedChat.value = userItem;
  if (messageList.value) {
    messageList.value.scrollToBottom();
  }
}

function handleSelectUser(user) {
  selectChat(user);
  search.value = '';
}

function handleBackToConversations() {
  selectedChat.value = null;
  showSidebar.value = true;
}

// ------------------- LOGOUT -------------------
function logout() {
  store.logout();
}

// ------------------- USER ACTIVITY TRACKING -------------------
async function updateUserActivity() {
  if (!user.value) return;
  const userRef = doc(db, "users", user.value.uid);
  await setDoc(userRef, { lastActive: new Date() }, { merge: true });
}

// ------------------- FILTER MESSAGES -------------------
const filteredMessages = computed(() => {
  if (!selectedChat.value) return [];
  return messages.value.filter(
    (msg) =>
      (msg.userId === user.value.uid &&
        msg.toUserId === selectedChat.value.uid) ||
      (msg.userId === selectedChat.value.uid && msg.toUserId === user.value.uid)
  );
});

// ------------------- SAVE MESSAGE -------------------
async function saveMessage(messageText) {
  if (!messageText.trim() || !selectedChat.value) return;

  // Update presence when sending a message
  updateMyPresence();

  await addDoc(collection(db, "chat"), {
    message: messageText,
    createdAt: new Date(),
    userId: user.value.uid,
    userName: user.value.displayName,
    toUserId: selectedChat.value.uid,
    toUserName: selectedChat.value.displayName,
    userPhotoURL: user.value.photoURL || null,
  });
  if (messageList.value) {
    messageList.value.scrollToBottom();
  }
}
</script>
