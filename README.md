# Zoroz — Portfolio Website

A dark, purple-glassmorphism one-page portfolio built to match your logo (the code/brain motif shows up as floating `{}` `<>` `.css` symbols in the hero).

## Files
- `index.html` — all sections (Home, About, Skills, Work, Process, Reviews, Contact)
- `style.css` — theme, layout, animations
- `script.js` — typing effect, counters, scroll reveal, tilt cards, magnetic buttons, animated blobs
- `firebase-config.js` — Firestore-powered visit counter (shown in the footer)

## 1. Preview it
Just open `index.html` in a browser — everything except the Firebase counter works with zero setup.

## 2. Connect Firebase (for the visit counter)
1. Create a project at https://console.firebase.google.com
2. Add a **Web app** and copy the config object it gives you
3. Paste those values into `firebaseConfig` at the top of `firebase-config.js`
4. Create a **Firestore Database** (production mode)
5. Paste the security rules included as a comment at the top of `firebase-config.js`

Once connected, every page load increments a `total` counter and a per-section counter (`home`, `about`, `skills`, etc.) stored in `analytics/pageViews`, so you can see which sections get the most attention.

### Hire Me popup
Clicking any "Hire Me" button opens a form asking for: name, business name, date of birth, phone number, business email (all required), plus Instagram and YouTube (optional). Submissions are saved to the `hireRequests` collection in Firestore — view them anytime in the Firebase Console under Firestore Database. Each entry also records `createdAt` and the page URL it was submitted from. The security rules above lock this collection so only new entries can be created — nobody can read or edit existing leads except you, from the console.

## 3. Deploy with Firebase Hosting
```
npm install -g firebase-tools
firebase login
firebase init hosting     # select this folder as the public directory
firebase deploy
```

## 4. Customize
- Swap real client testimonials into the Reviews section
- Add real screenshots/thumbnails to the project cards if you want
- Replace the "Creative Projects" cards with links once those sites are live
- Your logo images (`27022.png` / `27030.png`) can be dropped in as the favicon or nav logo — just add `<link rel="icon" href="logo.png">` in the `<head>`
