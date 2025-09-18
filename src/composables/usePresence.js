import { ref as dbRef, set, onValue, onDisconnect, serverTimestamp } from 'firebase/database';
import { realtimeDb } from '@/main';
import { ref, onUnmounted } from 'vue';

export function usePresence() {
  const isOnline = ref(false);
  const lastSeen = ref(null);
  const onlineUsers = ref({});

  let presenceRef = null;
  let presenceUnsubscribe = null;
  let currentUserId = null;

  const initPresence = (userId) => {
    if (!userId) {
      console.log('🔧 No userId provided to initPresence');
      return;
    }

    // If we're already initialized for this user, don't reinitialize
    if (currentUserId === userId && presenceRef) {
      console.log('🔧 Presence already initialized for user:', userId);
      return;
    }

    // Clean up previous presence if switching users
    if (presenceRef && currentUserId !== userId) {
      console.log('🔧 Cleaning up previous presence for user:', currentUserId);
      if (presenceUnsubscribe) {
        presenceUnsubscribe();
      }
    }

    currentUserId = userId;

    console.log('🔧 Initializing presence for user:', userId);
    console.log('🔧 Firebase Realtime Database:', realtimeDb);

    // Reference to this user's presence data
    presenceRef = dbRef(realtimeDb, `presence/${userId}`);

    // Reference to check connection status
    const connectedRef = dbRef(realtimeDb, '.info/connected');

    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        console.log('🟢 User is connected, setting online status');
        // User is online
        set(presenceRef, {
          online: true,
          lastSeen: serverTimestamp()
        }).then(() => {
          console.log('✅ Successfully set online status');
        }).catch((error) => {
          console.error('❌ Error setting online status:', error);
        });

        // When user disconnects, update their presence
        onDisconnect(presenceRef).set({
          online: false,
          lastSeen: serverTimestamp()
        });
      }
    });

    // Listen to all users' presence
    const allPresenceRef = dbRef(realtimeDb, 'presence');
    presenceUnsubscribe = onValue(allPresenceRef, (snapshot) => {
      const data = snapshot.val();
      console.log('📡 Presence data received:', data);
      if (data) {
        onlineUsers.value = data;
        console.log('👥 Updated onlineUsers:', Object.keys(data).length, 'users');
      } else {
        onlineUsers.value = {};
        console.log('👥 No presence data available');
      }
    });
  };

  const checkUserOnline = (uid) => {
    if (!uid || !onlineUsers.value[uid]) {
      console.log(`👤 User ${uid} not found in presence data`);
      return false;
    }
    const isOnline = onlineUsers.value[uid].online === true;
    console.log(`👤 User ${uid} online status:`, isOnline);
    return isOnline;
  };

  const getUserLastSeen = (uid) => {
    if (!uid || !onlineUsers.value[uid]) return null;
    return onlineUsers.value[uid].lastSeen;
  };

  const updateMyPresence = async () => {
    if (presenceRef && currentUserId) {
      await set(presenceRef, {
        online: true,
        lastSeen: serverTimestamp()
      });
    }
  };

  // Cleanup on unmount
  onUnmounted(() => {
    if (presenceRef) {
      set(presenceRef, {
        online: false,
        lastSeen: serverTimestamp()
      });
    }
    if (presenceUnsubscribe) {
      presenceUnsubscribe();
    }
  });

  return {
    initPresence,
    isOnline,
    lastSeen,
    onlineUsers,
    checkUserOnline,
    getUserLastSeen,
    updateMyPresence
  };
}