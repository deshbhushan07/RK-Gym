// src/services/memberService.js
import { db } from './firebase';
import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, query, orderBy, where, serverTimestamp
} from 'firebase/firestore';

const COL = 'members';

export const addMember = async (data) => {
  return await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    status: 'active'
  });
};

export const getMembers = async () => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getMember = async (id) => {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateMember = async (id, data) => {
  return await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
};

export const deleteMember = async (id) => {
  return await deleteDoc(doc(db, COL, id));
};

export const getActiveMembers = async () => {
  const q = query(collection(db, COL), where('status', '==', 'active'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
