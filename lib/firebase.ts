import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, updateDoc, query, orderBy, onSnapshot, writeBatch } from 'firebase/firestore';

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

export { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
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
