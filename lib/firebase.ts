import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User, browserPopupRedirectResolver } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, updateDoc, query, orderBy, onSnapshot, writeBatch, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
const googleProvider = new GoogleAuthProvider();

// Forçar seleção de conta pode ajudar em alguns cenários de erro de sessão
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

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
