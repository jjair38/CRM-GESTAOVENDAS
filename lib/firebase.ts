import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User, browserPopupRedirectResolver } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, updateDoc, query, orderBy, onSnapshot, writeBatch, getDocFromServer } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0681293134",
  appId: "1:15335194180:web:ebc76e43eca816c9c30611",
  apiKey: "AIzaSyAXBgMvLJwY7NjW82XxfsGpSsmvNwtdLK4",
  authDomain: "gen-lang-client-0681293134.firebaseapp.com",
  storageBucket: "gen-lang-client-0681293134.firebasestorage.app",
  messagingSenderId: "15335194180",
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Forçar seleção de conta pode ajudar em alguns cenários de erro de sessão
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Testar conexão inicial (conforme diretrizes da skill)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection test successful");
  } catch (error) {
    console.error("Firebase connection test failed:", error);
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}

export { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  browserPopupRedirectResolver,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch
};
export type { User };
