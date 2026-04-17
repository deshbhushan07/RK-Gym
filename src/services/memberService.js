// src/services/memberService.js
import { db } from './firebase';
import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, query, orderBy, where, serverTimestamp, getDocs as getDocsAlias
} from 'firebase/firestore';

const COL = 'members';

const generateMemberId = async () => {
  const snap = await getDocs(collection(db, COL));
  const count = snap.size + 1;
  return `RKF-${String(count).padStart(3, '0')}`;
};

export const addMember = async (data) => {
  const memberId = await generateMemberId();
  return await addDoc(collection(db, COL), {
    ...data,
    memberId,
    createdAt: serverTimestamp(),
    status: data.status || 'active'
  });
};

export const getMembers = async () => {
  const snap = await getDocs(collection(db, COL));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aD = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const bD = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return bD - aD;
    });
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
  const all = await getMembers();
  return all.filter(m => m.status === 'active');
};