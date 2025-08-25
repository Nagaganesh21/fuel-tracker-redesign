// Firebase is optional here. If not configured, we just show "Offline".
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export let db = null;
export let isFirebaseConfigured = false;

// Replace with your own config if you want cloud sync.
// If left as-is and fails, the app still works with localStorage.
const firebaseConfig = {
  apiKey: "AIzaSyB-Og_0PuU-mQbMu4YpbdQlxBTP4Kexuqg",
  authDomain: "fuel-tracker-2982b.firebaseapp.com",
  projectId: "fuel-tracker-2982b",
  storageBucket: "fuel-tracker-2982b.appspot.com",
  messagingSenderId: "12406726460",
  appId: "1:12406726460:web:d0a9bdefe54cc957894839"
};

export function initFirebase() {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseConfigured = true;
    return true;
  } catch (err) {
    // Not configured / blocked — we’re fine with local-only mode.
    console.warn("Firebase init failed or not configured. Running local-only.", err?.message || err);
    return false;
  }
}
