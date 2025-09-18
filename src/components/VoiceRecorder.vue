<template>
  <div class="voice-recorder">
    <div v-if="!isRecording && !audioURL" class="flex items-center">
      <button
        @click="startRecording"
        class="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600"
        :disabled="!selectedChat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2zm5.3 6c0 3-2.54 5.1-5.3 5.1S6.7 11 6.7 8H5c0 3.41 2.72 6.23 6 6.72V17h2v-2.28c3.28-.49 6-3.31 6-6.72h-1.7z"/>
        </svg>
      </button>
    </div>

    <div v-if="isRecording" class="flex items-center gap-3 bg-red-50 rounded-lg p-3">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        <span class="text-sm text-red-600 font-medium">{{ formatTime(recordingTime) }}</span>
      </div>

      <div class="flex gap-2">
        <button
          @click="cancelRecording"
          class="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        <button
          @click="stopRecording"
          class="p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="audioURL && !isRecording" class="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
      <button
        @click="playPause"
        class="p-1.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
      >
        <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      </button>

      <span class="text-sm text-blue-600 font-medium">{{ formatTime(audioDuration) }}</span>

      <div class="flex gap-2 ml-auto">
        <button
          @click="cancelRecording"
          class="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        <button
          @click="sendVoiceMessage"
          class="p-1.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 20v-6l8-2l-8-2V4l19 8z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';

defineProps({
  selectedChat: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['send-voice-message']);

const isRecording = ref(false);
const isPlaying = ref(false);
const recordingTime = ref(0);
const audioDuration = ref(0);
const audioURL = ref('');
const mediaRecorder = ref(null);
const audioChunks = ref([]);
const audioElement = ref(null);
let recordingTimer = null;

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.value = new MediaRecorder(stream);
    audioChunks.value = [];

    mediaRecorder.value.ondataavailable = (event) => {
      audioChunks.value.push(event.data);
    };

    mediaRecorder.value.onstop = () => {
      const audioBlob = new Blob(audioChunks.value, { type: 'audio/wav' });
      audioURL.value = URL.createObjectURL(audioBlob);

      // Calculate duration
      const audio = new Audio(audioURL.value);
      audio.addEventListener('loadedmetadata', () => {
        audioDuration.value = Math.floor(audio.duration);
      });

      // Stop all tracks to release microphone
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.value.start();
    isRecording.value = true;
    recordingTime.value = 0;

    // Start timer
    recordingTimer = setInterval(() => {
      recordingTime.value++;
    }, 1000);

  } catch (error) {
    console.error('Error accessing microphone:', error);
    alert('Could not access microphone. Please check permissions.');
  }
}

function stopRecording() {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
    isRecording.value = false;
    clearInterval(recordingTimer);
  }
}

function cancelRecording() {
  if (isRecording.value) {
    mediaRecorder.value.stop();
    isRecording.value = false;
    clearInterval(recordingTimer);
  }

  // Clean up
  if (audioURL.value) {
    URL.revokeObjectURL(audioURL.value);
  }
  audioURL.value = '';
  recordingTime.value = 0;
  audioDuration.value = 0;

  if (audioElement.value) {
    audioElement.value.pause();
    audioElement.value = null;
  }
  isPlaying.value = false;
}

function playPause() {
  if (!audioElement.value) {
    audioElement.value = new Audio(audioURL.value);
    audioElement.value.addEventListener('ended', () => {
      isPlaying.value = false;
    });
  }

  if (isPlaying.value) {
    audioElement.value.pause();
    isPlaying.value = false;
  } else {
    audioElement.value.play();
    isPlaying.value = true;
  }
}

function sendVoiceMessage() {
  if (audioURL.value) {
    // Convert to blob for sending
    fetch(audioURL.value)
      .then(res => res.blob())
      .then(blob => {
        emit('send-voice-message', {
          audioBlob: blob,
          duration: audioDuration.value
        });
        cancelRecording();
      });
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

onUnmounted(() => {
  if (recordingTimer) {
    clearInterval(recordingTimer);
  }
  if (audioURL.value) {
    URL.revokeObjectURL(audioURL.value);
  }
  if (audioElement.value) {
    audioElement.value.pause();
  }
});
</script>