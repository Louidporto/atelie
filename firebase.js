// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Suas credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCHJ8-XmMSy2-fAKIGE78eyS2s6uZnLyNk",
  authDomain: "catalogo-festas-a2e5d.firebaseapp.com",
  projectId: "catalogo-festas-a2e5d",
  storageBucket: "catalogo-festas-a2e5d.firebasestorage.app",
  messagingSenderId: "691924544390",
  appId: "1:691924544390:web:ece40694be36fd06efda07",
  measurementId: "G-FYBP6P6NLV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exportando os serviços para uso nos scripts
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup, signOut, onAuthStateChanged };