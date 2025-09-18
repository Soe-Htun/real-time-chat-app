import { createApp } from 'vue'
import App from './App.vue'
import './main.css'
import router from "./router/index"
import { createPinia } from "pinia" ;
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB2Br0W1SJaeMRFbDHuopifVm_ZerEgPeo",
  authDomain: "chatapp-15b27.firebaseapp.com",
  projectId: "chatapp-15b27",
//   storageBucket: "chatapp-15b27.firebasestorage.app",
  storageBucket: "chatapp-15b27.appspot.com",
  messagingSenderId: "49875310223",
  appId: "1:49875310223:web:679f51d0283378801942fa",
  measurementId: "G-27NLP8SBFM"
};

const firebaseApp = initializeApp(firebaseConfig);
getAnalytics(firebaseApp);

export const db = getFirestore(firebaseApp);

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate)
app.use(pinia);
app.use(router);
app.mount('#app');
