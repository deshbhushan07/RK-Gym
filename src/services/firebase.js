// src/services/firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDH1IvQSjg4_x4oUvPmtwzXS2wFOgjrkO0",
  authDomain: "rk-fitness-a638d.firebaseapp.com",
  projectId: "rk-fitness-a638d",
  storageBucket: "rk-fitness-a638d.firebasestorage.app",
  messagingSenderId: "255393407774",
  appId: "1:255393407774:web:fd30c8ac4382c2ceed9f0f",
  measurementId: "G-3V7B79QGRS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);