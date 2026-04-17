// src/services/trainerService.js
import { db } from './firebase';
import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore';

const COL = 'trainers';

const generateTrainerId = async () => {
  const snap = await getDocs(collection(db, COL));
  const count = snap.size + 1;
  return `TRN-${String(count).padStart(3, '0')}`;
};

export const addTrainer = async (data) => {
  const trainerId = await generateTrainerId();
  return await addDoc(collection(db, COL), {
    ...data,
    trainerId,
    createdAt: serverTimestamp()
  });
};

export const getTrainers = async () => {
  const snap = await getDocs(collection(db, COL));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aD = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const bD = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return bD - aD;
    });
};

export const getTrainer = async (id) => {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateTrainer = async (id, data) => {
  return await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
};

export const deleteTrainer = async (id) => {
  return await deleteDoc(doc(db, COL, id));
};