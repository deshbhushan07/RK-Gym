# 🏋️ RK Fitness — Gym Management System
**Vasagade, Kolhapur**

A full-stack gym management web app built with React.js + Firebase + Cloudinary.

---

## 📁 Project Structure

```
rk-fitness/
├── public/
│   └── index.html
├── src/
│   ├── admin/
│   │   ├── Dashboard.jsx       ← Stats, revenue chart, expiry alerts
│   │   ├── Members.jsx         ← Full CRUD + photo upload
│   │   ├── Trainers.jsx        ← Trainer management
│   │   ├── Payments.jsx        ← Payment tracking
│   │   ├── DietPlans.jsx       ← Diet plan builder
│   │   └── Attendance.jsx      ← Daily check-in system
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.js      ← Firebase Auth context
│   ├── pages/
│   │   └── Login.jsx
│   ├── services/
│   │   ├── firebase.js         ← ⚠️ Add your Firebase config here
│   │   ├── memberService.js
│   │   ├── trainerService.js
│   │   ├── paymentService.js
│   │   ├── attendanceService.js
│   │   └── dietService.js
│   ├── utils/
│   │   └── cloudinaryUpload.js ← ⚠️ Add your Cloudinary config here
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── .firebaserc
└── package.json
```

---

## 🚀 SETUP & DEPLOYMENT GUIDE

### STEP 1 — Install Node.js
Download from: https://nodejs.org (LTS version recommended)
Verify: `node -v` and `npm -v`

---

### STEP 2 — Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add project"** → Name it `rk-fitness`
3. Enable Google Analytics (optional)

#### Enable Authentication:
- Firebase Console → **Authentication** → **Get Started**
- Enable **Email/Password** provider
- Go to **Users** tab → **Add User**
- Add: `admin@rkfitness.com` / `YourPassword123`

#### Enable Firestore:
- Firebase Console → **Firestore Database** → **Create Database**
- Choose **Production mode** (rules will be deployed separately)
- Select region: `asia-south1` (Mumbai) for best performance

#### Get your Firebase config:
- Firebase Console → **Project Settings** (gear icon) → **Your Apps**
- Click **"Add App"** → **Web** (</>)
- Register app name: `rk-fitness-web`
- Copy the `firebaseConfig` object

---

### STEP 3 — Add Firebase Config to Project

Open `src/services/firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",               // ← your actual key
  authDomain: "rk-fitness.firebaseapp.com",
  projectId: "rk-fitness",
  storageBucket: "rk-fitness.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

### STEP 4 — Setup Cloudinary (for member photo uploads)

1. Sign up free at: https://cloudinary.com
2. Go to **Dashboard** → note your **Cloud Name**
3. Go to **Settings** → **Upload** tab
4. Scroll to **Upload presets** → **Add upload preset**
   - Signing Mode: **Unsigned**
   - Preset name: `rk-fitness-upload`
   - Folder: `rk-fitness`
   - Save

5. Open `src/utils/cloudinaryUpload.js` and update:
```js
const CLOUD_NAME = 'your_cloud_name_here';
const UPLOAD_PRESET = 'rk-fitness-upload';
```

> **Note:** If you skip Cloudinary, photo upload won't work but everything else will.

---

### STEP 5 — Install Dependencies

```bash
cd rk-fitness
npm install
```

---

### STEP 6 — Run Locally

```bash
npm start
```

Opens at: http://localhost:3000
Login with the admin credentials you created in Firebase.

---

### STEP 7 — Deploy to Firebase Hosting

#### Install Firebase CLI (one-time):
```bash
npm install -g firebase-tools
```

#### Login to Firebase:
```bash
firebase login
```

#### Update .firebaserc with your project ID:
Open `.firebaserc` and replace `YOUR_FIREBASE_PROJECT_ID` with your actual project ID
(visible in Firebase Console URL: `https://console.firebase.google.com/project/YOUR_ID/...`)

#### Deploy Firestore Rules:
```bash
firebase deploy --only firestore:rules
```

#### Deploy Firestore Indexes:
```bash
firebase deploy --only firestore:indexes
```

#### Build and Deploy the App:
```bash
npm run build
firebase deploy --only hosting
```

Your app will be live at: `https://YOUR_PROJECT_ID.web.app`

#### Deploy Everything at Once:
```bash
npm run build && firebase deploy
```

---

### STEP 8 — Deploy to Vercel (Alternative — Easier)

1. Push your code to GitHub
2. Go to https://vercel.com → Import your repo
3. Framework: **Create React App**
4. Click **Deploy** — done!

Live URL: `https://rk-fitness.vercel.app`

---

## ✅ Features

| Module       | Features                                                        |
|--------------|-----------------------------------------------------------------|
| Dashboard    | Stats overview, revenue chart, expiring plans, today's check-ins|
| Members      | Add/Edit/Delete, photo upload, trainer & diet assignment        |
| Trainers     | Add/Edit/Delete, member count per trainer                       |
| Payments     | Record payments, cash/UPI/card, monthly revenue summary         |
| Diet Plans   | Create meal plans with per-meal breakdown, assign to members    |
| Attendance   | One-click daily check-in, history log, prevents duplicate marking|

---

## 🔧 Troubleshooting

**"Firebase: Error (auth/invalid-api-key)"**
→ Check `src/services/firebase.js` — ensure your config values are correct

**"Missing or insufficient permissions"**
→ Deploy Firestore rules: `firebase deploy --only firestore:rules`

**Photo upload not working**
→ Check Cloudinary CLOUD_NAME and UPLOAD_PRESET in `cloudinaryUpload.js`
→ Make sure the upload preset is set to **Unsigned**

**Blank screen after deploy**
→ Ensure `firebase.json` has the rewrite rule for SPA routing (already included)

---

## 💡 Pro Tips

- **Backup**: Export Firestore data monthly from Firebase Console → Firestore → Import/Export
- **Notifications**: Add WhatsApp reminders via Twilio or MSG91 for plan expiry alerts
- **PDF Receipts**: Use `jspdf` + `html2canvas` to generate payment receipts
- **Online Payments**: Integrate Razorpay for online fee collection

---

## 🛠️ Tech Stack

- **React 18** — UI framework
- **Firebase Auth** — Admin authentication
- **Firestore** — NoSQL database
- **Cloudinary** — Image storage
- **Recharts** — Revenue charts
- **React Router v6** — Client-side routing
- **React Toastify** — Notifications
- **React Icons** — Icon library
- **date-fns** — Date utilities

---

Built with ❤️ for RK Fitness, Vasagade, Kolhapur
