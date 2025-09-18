<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <div class="bg-white p-8 rounded-lg shadow-md w-80 text-center">
      <h3 class="text-xl font-semibold mb-6 text-gray-700">
        Please login with your Google account
      </h3>

      <button
        @click="login"
        class="flex items-center justify-center w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        <img
          src="https://www.svgrepo.com/show/355037/google.svg"
          alt="Google"
          class="w-5 h-5 mr-2"
        />
        Login with Google
      </button>
    </div>
  </div>
</template>

<script setup>
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/index";

const router = useRouter();
const store = useAuthStore()
// init Firebase Auth
const auth = getAuth();
const provider = new GoogleAuthProvider();

async function login() {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const user = result.user;

    store.setUser(user, token);

    router.push("/");
  } catch (error) {
    console.error("Error logging in with Google:", error);
  }
}
</script>
