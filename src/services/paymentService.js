// src/services/paymentService.js
import { db } from './firebase';
import {
  collection, addDoc, getDocs, query,
  orderBy, where, serverTimestamp, Timestamp
} from 'firebase/firestore';

const COL = 'payments';

export const addPayment = async (data) => {
  return await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
};

export const getPayments = async () => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getPaymentsByMember = async (memberId) => {
  const q = query(collection(db, COL), where('memberId', '==', memberId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getMonthlyRevenue = async () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const q = query(
    collection(db, COL),
    where('createdAt', '>=', Timestamp.fromDate(start)),
    where('status', '==', 'paid')
  );
  const snap = await getDocs(q);
  return snap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);
};
