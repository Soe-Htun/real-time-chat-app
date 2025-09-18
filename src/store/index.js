import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: null,
  }),
  actions: {
    setUser(user, token) {
      this.user = user;
      this.token = token;
    },
    clearUser() {
      this.user = null;
      this.token = null;
    },
    logout() {
      this.clearUser();
    },
  },
  persist: true
});
