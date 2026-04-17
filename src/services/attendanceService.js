// src/services/attendanceService.js
import { db } from './firebase';
import {
  collection, addDoc, getDocs, query,
  where, orderBy, serverTimestamp, Timestamp
} from 'firebase/firestore';

const COL = 'attendance';

export const markAttendance = async (memberId, memberName, status = 'present') => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch only by memberId (single field — no index needed)
  // Then check date client-side
  const q = query(collection(db, COL), where('memberId', '==', memberId));
  const snap = await getDocs(q);
  const alreadyMarked = snap.docs.some(d => {
    const date = d.data().date?.toDate ? d.data().date.toDate() : null;
    return date && date >= today;
  });
  if (alreadyMarked) throw new Error(`${memberName} already marked today`);

  return await addDoc(collection(db, COL), {
    memberId,
    memberName,
    status,
    date: serverTimestamp(),
    createdAt: serverTimestamp()
  });
};

export const getTodayAttendance = async () => {
  // Fetch all, filter client-side — no composite index needed
  const snap = await getDocs(collection(db, COL));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(a => {
      const date = a.date?.toDate ? a.date.toDate() : null;
      return date && date >= today;
    })
    .sort((a, b) => {
      const aD = a.date?.toDate ? a.date.toDate() : new Date(0);
      const bD = b.date?.toDate ? b.date.toDate() : new Date(0);
      return bD - aD;
    });
};

export const getAttendanceByMember = async (memberId) => {
  const q = query(collection(db, COL), where('memberId', '==', memberId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aD = a.date?.toDate ? a.date.toDate() : new Date(0);
      const bD = b.date?.toDate ? b.date.toDate() : new Date(0);
      return bD - aD;
    });
};

export const getAllAttendance = async () => {
  const snap = await getDocs(collection(db, COL));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aD = a.date?.toDate ? a.date.toDate() : new Date(0);
      const bD = b.date?.toDate ? b.date.toDate() : new Date(0);
      return bD - aD;
    });
};