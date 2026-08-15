// ============================================================
// FIREBASE SETUP
//
// This site now shares its Firebase project with a separate local-only
// admin panel (the "tn-developer-admin" folder). The admin panel is where
// you add new websites/apps and view analytics + hire requests — see the
// admin panel's own README.md for full setup steps (enabling Auth, creating
// your admin login, etc). Once that's done, replace ADMIN_UID below with
// your real admin user's UID (Firebase Console → Authentication → Users)
// and paste this full rules block into Firestore → Rules:
//
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        function isAdmin() {
//          return request.auth != null && request.auth.uid == "ADMIN_UID";
//        }
//        match /analytics/pageViews {
//          allow read: if true;
//          allow write: if request.resource.data.keys().hasOnly(['home','about','skills','projects','process','testimonials','contact','total']);
//        }
//        match /analytics/appDownloads {
//          allow read: if true;
//          allow write: if true; // app IDs are dynamic now (added via admin panel), so counts stay open like pageViews
//        }
//        match /hireRequests/{docId} {
//          allow create: if request.resource.data.keys().hasAll(['name','businessName','dob','businessEmail','createdAt'])
//                         && request.resource.data.name is string
//                         && request.resource.data.businessEmail is string;
//          allow read, update, delete: if isAdmin(); // only the admin panel can see/manage these
//        }
//        match /projects/{docId} {
//          allow read: if true;           // public site reads these to render the Websites section
//          allow write: if isAdmin();     // only the admin panel can add/edit/delete
//        }
//        match /apps/{docId} {
//          allow read: if true;           // public site reads these to render the Apps section
//          allow write: if isAdmin();     // only the admin panel can add/edit/delete
//        }
//      }
//    }
//
// Firebase Hosting (to publish this site):
//    npm install -g firebase-tools
//    firebase login
//    firebase init hosting   (choose this folder as the public directory)
//    firebase deploy
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
  query,
  orderBy,
  getDocs,
  limit,
  where,
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

// Apps whose APK downloads we count individually (data-app-id on the button)
// used to be a fixed list here. Apps are now fully dynamic (added from the
// admin panel), so any app ID is trackable — no allowlist needed.

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

// ============ APK DOWNLOAD COUNTER ============
// Counts each download in Firestore (analytics/appDownloads) and keeps any
// on-page ".app-download-count[data-app-id]" element updated live for every
// visitor viewing the site — same pattern as the footer visit counter above.
async function trackAppDownload(appId) {
  if (!firebaseReady || !appId) return;
  try {
    const ref = doc(db, "analytics", "appDownloads");
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists() ? snap.data() : {};
      const updated = { ...data };
      updated.total = (data.total || 0) + 1;
      updated[appId] = (data[appId] || 0) + 1;
      tx.set(ref, updated, { merge: true });
    });
  } catch (err) {
    console.warn("Firebase download tracking not configured yet:", err.message);
  }
}
window.trackApkDownload = trackAppDownload;

function listenAppDownloadCounts() {
  if (!firebaseReady) return;
  const countEls = document.querySelectorAll(".app-download-count[data-app-id]");
  if (!countEls.length) return;
  try {
    const ref = doc(db, "analytics", "appDownloads");
    onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : {};
      countEls.forEach((el) => {
        const count = data[el.dataset.appId] || 0;
        el.textContent = `⬇ ${count.toLocaleString()} downloads`;
      });
    });
  } catch (err) {
    console.warn("Firebase download counter not configured yet:", err.message);
  }
}
listenAppDownloadCounts();

// ============ DYNAMIC WEBSITES + APPS (loaded from the admin panel) ============
// The "Websites" and "Apps" sections below are populated from Firestore
// (collections "projects" and "apps") if the admin panel has added anything
// there. If those collections are still empty, the original static cards
// already written in index.html are left exactly as they are — so the site
// never breaks or shows an empty section before the admin panel is used.
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function renderPremiumProjectCard(p) {
  const features = (p.features || []).map(f => `<li>✔ ${escapeHtml(f)}</li>`).join("");
  return `<a href="${escapeHtml(p.url || '#')}" target="_blank" rel="noopener" class="glass-card project-card tilt reveal">
    <div class="project-badge">${escapeHtml(p.badge || '🥇 Premium')}</div>
    <h3>${escapeHtml(p.title)}</h3>
    <p class="project-link">${escapeHtml(p.displayUrl || p.url || '')}</p>
    <ul class="project-features">${features}</ul>
    <span class="project-cta">Visit Site →</span>
  </a>`;
}

function renderCreativeProjectCard(p) {
  return `<div class="glass-card creative-card tilt reveal"><span class="creative-icon">${escapeHtml(p.icon || '✨')}</span><h4>${escapeHtml(p.title)}</h4></div>`;
}

function renderAppCard(a) {
  const features = (a.features || []).map(f => `<li>✔ ${escapeHtml(f)}</li>`).join("");
  const hasApk = a.apkUrl && !String(a.apkUrl).includes('PASTE_YOUR_APK_LINK_HERE');
  return `<div class="glass-card app-card tilt reveal">
    <div class="app-card-top">
      <div class="app-icon">${escapeHtml(a.icon || '📱')}</div>
      <div class="app-card-title">
        <h3>${escapeHtml(a.name)}</h3>
        <p class="app-tag">${escapeHtml(a.tag || '')}</p>
      </div>
      <span class="app-badge">${escapeHtml(a.badge || 'Free')}</span>
    </div>
    <p class="app-desc">${escapeHtml(a.desc || '')}</p>
    <ul class="app-features">${features}</ul>
    ${hasApk ? `<button type="button" class="btn btn-primary magnetic app-download-btn"
        data-apk-url="${escapeHtml(a.apkUrl)}"
        data-app-id="${escapeHtml(a.appId || a.id)}"
        data-app-name="${escapeHtml(a.name)}"
        data-file-name="${escapeHtml(a.fileName || (a.name + '.apk'))}">⬇ Download APK</button>` : ''}
    <p class="app-meta">${escapeHtml(a.meta || 'Android • Direct APK install • Not on Play Store')}${a.versionLabel ? ` • v${escapeHtml(a.versionLabel)}` : ''}</p>
    <p class="app-download-count" data-app-id="${escapeHtml(a.appId || a.id)}">⬇ — downloads</p>
  </div>`;
}

async function loadDynamicContent() {
  if (!firebaseReady) return;

  // ---- Websites (projects) ----
  try {
    const q = query(collection(db, "projects"), orderBy("order", "asc"));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.active !== false);
      const premium = docs.filter(p => (p.category || 'premium') === 'premium');
      const creative = docs.filter(p => p.category === 'creative');

      if (premium.length) {
        const grid = document.querySelector('.projects-grid');
        if (grid) grid.innerHTML = premium.map(renderPremiumProjectCard).join("");
      }
      if (creative.length) {
        const grid = document.querySelector('.creative-grid');
        if (grid) grid.innerHTML = creative.map(renderCreativeProjectCard).join("");
      }
    }
  } catch (err) {
    console.warn("Could not load dynamic projects:", err.message);
  }

  // ---- Apps ----
  try {
    const q = query(collection(db, "apps"), orderBy("order", "asc"));
    const snap = await getDocs(q);
    if (!snap.empty) {
      let docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(a => a.active !== false);

      // For each app, check for a version marked "visible" (set from the
      // admin panel's Versions list) and use its APK link/file name instead
      // of the app's own apkUrl/fileName fields. If no version is marked
      // visible yet, the app's own apkUrl/fileName are used unchanged.
      docs = await Promise.all(docs.map(async (a) => {
        try {
          const vq = query(
            collection(db, "apps", a.id, "versions"),
            where("visible", "==", true),
            limit(1)
          );
          const vsnap = await getDocs(vq);
          if (!vsnap.empty) {
            const v = vsnap.docs[0].data();
            return { ...a, apkUrl: v.apkUrl, fileName: v.fileName, versionLabel: v.version };
          }
        } catch (err) {
          console.warn(`Could not load live version for app ${a.id}:`, err.message);
        }
        return a;
      }));

      if (docs.length) {
        const grid = document.querySelector('.apps-grid');
        if (grid) grid.innerHTML = docs.map(renderAppCard).join("");
      }
    }
  } catch (err) {
    console.warn("Could not load dynamic apps:", err.message);
  }

  // Re-bind interactive behaviors + counters for the freshly-inserted cards.
  if (window.bindTiltCards) window.bindTiltCards();
  if (window.bindMagneticButtons) window.bindMagneticButtons();
  if (window.bindAppDownloadButtons) window.bindAppDownloadButtons();
  if (window.observeNewReveals) window.observeNewReveals();
  listenAppDownloadCounts();
}
loadDynamicContent();

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
    businessEmail: data.businessEmail,
    instagram: data.instagram || "",
    youtube: data.youtube || "",
    source: "hire-popup",
    page: location.href,
    createdAt: serverTimestamp(),
  });
};
