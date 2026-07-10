// ============================================================
// FIREBASE SETUP
// 1. Go to https://console.firebase.google.com → create a project
// 2. Project settings → General → "Your apps" → Web app → copy the config
// 3. Paste your config values below (replace every "YOUR_..." placeholder)
// 4. Firestore Database → Create database → Start in production mode
// 5. Firestore Rules (Rules tab) — paste this so visitors can only
//    increment the counter and create new hire requests (never read/edit
//    other people's hire requests):
//
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /analytics/pageViews {
//          allow read: if true;
//          allow write: if request.resource.data.keys().hasOnly(['home','about','skills','projects','process','testimonials','contact','total']);
//        }
//        match /hireRequests/{docId} {
//          allow create: if request.resource.data.keys().hasAll(['name','businessName','dob','phone','businessEmail','createdAt'])
//                         && request.resource.data.name is string
//                         && request.resource.data.businessEmail is string;
//          allow read, update, delete: if false; // only visible in the Firebase console
//        }
//      }
//    }
//
// 6. Firebase Hosting (optional, to publish this site):
//    npm install -g firebase-tools
//    firebase login
//    firebase init hosting   (choose this folder as the public directory)
//    firebase deploy
//
// Hire requests submitted from the "Hire Me" popup are stored in the
// `hireRequests` collection — view them in Firebase Console → Firestore.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  collection,
  addDoc,
  runTransaction,
  onSnapshot,
  serverTimestamp,
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

let app, db, firebaseReady = false;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  firebaseReady = true;
} catch (err) {
  console.warn("Firebase failed to initialize:", err.message);
}

async function trackVisit() {
  if (!firebaseReady) return;
  try {
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

// ============ HIRE REQUEST SUBMISSION ============
// Called from script.js when the "Hire Me" popup form is submitted.
window.submitHireRequest = async function (data) {
  if (!firebaseReady) {
    throw new Error("Firebase is not configured yet — add your config to firebase-config.js");
  }
  const requestsRef = collection(db, "hireRequests");
  await addDoc(requestsRef, {
    name: data.name,
    businessName: data.businessName,
    dob: data.dob,
    phone: data.phone,
    businessEmail: data.businessEmail,
    instagram: data.instagram || "",
    youtube: data.youtube || "",
    source: "hire-popup",
    page: location.href,
    createdAt: serverTimestamp(),
  });
};
