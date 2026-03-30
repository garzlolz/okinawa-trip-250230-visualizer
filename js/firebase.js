import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyC0pJgycqVxdLcm0U_VNPgB9B7hEVNROTk",
  authDomain: "okinawa-trip-2025.firebaseapp.com",
  projectId: "okinawa-trip-2025",
  storageBucket: "okinawa-trip-2025.firebasestorage.app",
  messagingSenderId: "959389446092",
  appId: "1:959389446092:web:665c6d7557f0d6b5f17769",
};

const appId =
  typeof window.__app_id !== "undefined" ? window.__app_id : "default-trip-app";

let app, auth, db, storage, googleProvider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
  console.log("Firebase initialized successfully");
} catch (e) {
  console.error("Firebase init failed:", e);
}

export {
  auth,
  db,
  storage,
  appId,
  googleProvider,
  signInWithPopup,
  signOut,
  signInAnonymously,
  onAuthStateChanged,
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
};
