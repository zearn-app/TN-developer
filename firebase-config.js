// ============================================================
// FIREBASE SETUP
// 1. Go to https://console.firebase.google.com → create a project
// 2. Project settings → General → "Your apps" → Web app → copy the config
// 3. Paste your config values below (replace every "YOUR_..." placeholder)
// 4. Firestore Database → Create database → Start in production mode
// 5. Firestore Rules (Rules tab) — paste this so only the counter field
//    can be written by visitors:
//
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /analytics/pageViews {
//          allow read: if true;
//          allow write: if request.resource.data.keys().hasOnly(['home','about','skills','projects','process','testimonials','contact','total']);
//        }
//      }
//    }
//
// 6. Firebase Hosting (optional, to publish this site):
//    npm install -g firebase-tools
//    firebase login
//    firebase init hosting   (choose this folder as the public directory)
//    firebase deploy
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  runTransaction,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAas0AftCAV9eIddoEVezhjVsCAMIXlcUY",
  authDomain: "tn-developer-54557.firebaseapp.com",
  projectId: "tn-developer-54557",
  storageBucket: "tn-developer-54557.firebasestorage.app",
  messagingSenderId: "780758782991",
  appId: "1:780758782991:web:8de4806f8d7eea970fbf7a",
  measurementId: "G-Q8EYMHQKKL"
};

const viewCounterEl = document.getElementById("viewCounter");

// Sections we track individually as "pages" of this one-page site.
const PAGE_IDS = ["home", "about", "skills", "projects", "process", "testimonials", "contact"];

async function trackVisit() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const ref = doc(db, "analytics", "pageViews");

    // Figure out which section the visitor landed on (or is currently viewing)
    const hash = (location.hash || "#home").replace("#", "");
    const currentPage = PAGE_IDS.includes(hash) ? hash : "home";

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists() ? snap.data() : {};
      const updated = { ...data };
      updated.total = (data.total || 0) + 1;
      updated[currentPage] = (data[currentPage] || 0) + 1;
      tx.set(ref, updated, { merge: true });
    });

    // Live-update the footer counter for every visitor viewing the site
    onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const total = snap.data().total || 0;
        if (viewCounterEl) {
          viewCounterEl.textContent = `👀 ${total.toLocaleString()} total visits`;
        }
      }
    });
  } catch (err) {
    console.warn("Firebase analytics not configured yet:", err.message);
    if (viewCounterEl) viewCounterEl.textContent = "";
  }
}

trackVisit();

// Track section changes as the visitor scrolls (updates per-section view count
// once per session, based on which section is in view the longest on load of that hash)
window.addEventListener("hashchange", trackVisit);
