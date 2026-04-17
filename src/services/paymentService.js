// src/services/paymentService.js
import { db } from './firebase';
import {
  collection, addDoc, getDocs, serverTimestamp
} from 'firebase/firestore';

const COL = 'payments';

export const addPayment = async (data) => {
  return await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp()
  });
};

export const getPayments = async () => {
  const snap = await getDocs(collection(db, COL));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aD = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const bD = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return bD - aD;
    });
};

export const getPaymentsByMember = async (memberId) => {
  const all = await getPayments();
  return all.filter(p => p.memberId === memberId);
};

export const getMonthlyRevenue = async () => {
  const all = await getPayments();
  const now = new Date();
  return all
    .filter(p => {
      if (p.status !== 'paid') return false;
      const d = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(0);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);
};