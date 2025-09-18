// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as FBsignOut } from "firebase/auth";
// import { signOut as FBsignOut } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);


export const auth = getAuth(app);
export function signUp(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
}
export function signIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}
export function signOut() {
    return FBsignOut(auth);
}
