<template>
  <div class="max-w-6xl mx-auto">
    <h3 class="text-center text-lg font-semibold mb-4">Messaging</h3>
    <div class="border rounded-lg shadow-sm overflow-hidden flex">
      <!-- Sidebar (conversation list) -->
      <div class="w-2/5 border-r bg-gray-50 flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between border-b px-4 py-3 relative">
          <h4 class="text-sky-700 font-semibold text-lg">Chats</h4>
          <input
            v-model="search"
            type="text"
            class="border-b border-gray-300 bg-transparent focus:outline-none pr-7 text-sm w-40"
            placeholder="Search users"
          />
          <!-- Popup for user suggestions -->
          <div v-if="search && filteredUsers.length" class="absolute top-full left-0 w-full bg-white border mt-1 shadow z-10">
            <div
              v-for="u in filteredUsers"
              :key="u.uid"
              @click="selectChat(u); search=''"
              class="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
            >
              <img
                class="w-6 h-6 rounded-full"
                :src="u.photoURL || 'https://ptetutorials.com/images/user-profile.png'"
                alt="user"
              />
              <span class="text-sm">{{ u.displayName }}</span>
            </div>
          </div>
        </div>

        <!-- Conversation list -->
        <div class="flex-1 overflow-y-auto">
          <div
            v-for="conv in conversations"
            :key="conv.uid"
            @click="selectChat(conv)"
            class="flex items-center gap-3 border-b px-4 py-3 hover:bg-gray-100 cursor-pointer"
            :class="{ 'bg-gray-200': selectedChat?.uid === conv.uid }"
          >
            <img
              class="w-10 h-10 rounded-full"
              :src="conv.photoURL || 'https://ptetutorials.com/images/user-profile.png'"
              alt="user"
            />
            <div class="flex-1">
              <h5 class="flex justify-between text-sm font-medium text-gray-700">
                {{ conv.displayName }}
                <!-- <span class="text-xs text-gray-500">{{ time.format(conv.lastMessageTime) }} {{ dayMonth.format(conv.lastMessageTime) }}</span> -->
                 <span class="text-xs text-gray-500">
                  {{
                    formatLastMessageTime(conv.lastMessageTime)
                  }}
                </span>
              </h5>
              <p class="text-xs text-gray-500 truncate">{{ conv.lastMessage }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Messages Section -->
      <div class="w-3/5 flex flex-col">
        <!-- Header -->
        <div class="border-b px-4 py-3">
          <h4 class="font-semibold text-gray-700">
            {{ selectedChat ? selectedChat.displayName : "Select a chat" }}
          </h4>
        </div>

        <!-- Messages -->
        <div class="flex-1 overflow-y-auto h-[516px] p-4 space-y-3 msg_history">
          <div
            v-for="msg in filteredMessages"
            :key="msg.id"
            class="flex gap-2"
            :class="msg.userId === user.uid ? 'justify-end' : 'justify-start'"
          >
            <div v-if="msg.userId !== user.uid">
              <img
                class="w-8 h-8 rounded-full"
                :src="selectedChat?.photoURL || 'https://ptetutorials.com/images/user-profile.png'"
                alt="user"
              />
            </div>
            <div
              :class="msg.userId === user.uid ? 'bg-sky-600 text-white' : 'bg-gray-200 text-gray-700'"
              class="rounded px-3 py-2 max-w-xs text-sm"
            >
              <p>{{ msg.message }}</p>
              <span
                class="block mt-1 text-xs"
                :class="msg.userId === user.uid ? 'text-white' : 'text-gray-500'"
              >
                {{ time.format(msg.createdAt.toDate()) }} |
                {{ dayMonth.format(msg.createdAt.toDate()) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="border-t p-3 relative">
          <input
            v-model="message"
            @keyup.enter="saveMessage"
            type="text"
            class="w-full pr-10 text-sm focus:outline-none"
            placeholder="Type a message"
            :disabled="!selectedChat"
          />
          <button
            class="absolute right-4 top-1/2 -translate-y-1/2 bg-sky-600 hover:bg-sky-700 text-white p-2 rounded-full"
            type="button"
            @click="saveMessage"
            :disabled="!selectedChat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
              viewBox="0 0 24 24">
              <path d="M3 20v-6l8-2l-8-2V4l19 8z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { db } from "@/main";
import { collection, addDoc, query, orderBy, onSnapshot, doc, setDoc } from "firebase/firestore";
import { useAuthStore } from "@/store";
import { storeToRefs } from "pinia";
import { time, dayMonth, formatLastMessageTime } from "@/constants";
import debounce from "lodash/debounce";

const store = useAuthStore();
const { user } = storeToRefs(store);

const message = ref("");
const messages = ref([]);
const users = ref([]);
const conversations = ref([]);
const selectedChat = ref(null);
const search = ref("");

// ------------------- FETCH MESSAGES -------------------
onMounted(() => {
  const q = query(collection(db, "chat"), orderBy("createdAt", "asc"));
  onSnapshot(q, (snapshot) => {
    messages.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    buildConversations();
    scrollToBottom();
  });

  fetchUsers();
});

// ------------------- SCROLL TO BOTTOM -------------------
function scrollToBottom() {
  const box = document.querySelector(".msg_history");
  if (box) box.scrollTop = box.scrollHeight;
}

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
  });
}

// ------------------- BUILD CONVERSATIONS -------------------
function buildConversations() {
  const map = {};

  // Only include messages where the logged-in user is sender or receiver
  const myMessages = messages.value.filter(
    msg => msg.userId === user.value.uid || msg.toUserId === user.value.uid
  );

  myMessages.forEach((msg) => {
    const partnerId = msg.userId === user.value.uid ? msg.toUserId : msg.userId;
    if (!partnerId) return;

    if (!map[partnerId]) {
      map[partnerId] = {
        uid: partnerId,
        displayName: msg.userId === user.value.uid ? msg.toUserName : msg.userName,
        photoURL: msg.photoURL || null,
        lastMessage: msg.message,
        lastMessageTime: msg.createdAt.toDate(),
      };
    } else {
      map[partnerId].lastMessage = msg.message;
      map[partnerId].lastMessageTime = msg.createdAt.toDate();
    }
  });

  conversations.value = Object.values(map).sort(
    (a,b) => b.lastMessageTime - a.lastMessageTime
  )
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
    .filter(u => u.uid !== user.value.uid)
    .filter(u => u.displayName.toLowerCase().startsWith(debouncedSearch.value.toLowerCase()));
});

function selectChat(userItem) {
  selectedChat.value = userItem;
  scrollToBottom();
}

// ------------------- FILTER MESSAGES -------------------
const filteredMessages = computed(() => {
  if (!selectedChat.value) return [];
  return messages.value.filter(
    (msg) =>
      (msg.userId === user.value.uid && msg.toUserId === selectedChat.value.uid) ||
      (msg.userId === selectedChat.value.uid && msg.toUserId === user.value.uid)
  );
});

// ------------------- SAVE MESSAGE -------------------
async function saveMessage() {
  if (!message.value.trim() || !selectedChat.value) return;
  await addDoc(collection(db, "chat"), {
    message: message.value,
    createdAt: new Date(),
    userId: user.value.uid,
    userName: user.value.displayName,
    toUserId: selectedChat.value.uid,
    toUserName: selectedChat.value.displayName,
  });
  message.value = "";
  scrollToBottom();
}
</script>
