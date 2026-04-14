// src/services/dietService.js
import { db } from './firebase';
import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore';

const COL = 'dietPlans';

export const addDietPlan = async (data) => {
  return await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
};

export const getDietPlans = async () => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getDietPlan = async (id) => {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateDietPlan = async (id, data) => {
  return await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
};

export const deleteDietPlan = async (id) => {
  return await deleteDoc(doc(db, COL, id));
};
