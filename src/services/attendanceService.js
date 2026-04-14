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
  // check if already marked
  const q = query(
    collection(db, COL),
    where('memberId', '==', memberId),
    where('date', '>=', Timestamp.fromDate(today))
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error(`${memberName} already marked today`);
  }
  return await addDoc(collection(db, COL), {
    memberId, memberName, status,
    date: serverTimestamp(),
    createdAt: serverTimestamp()
  });
};

export const getTodayAttendance = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const q = query(
    collection(db, COL),
    where('date', '>=', Timestamp.fromDate(today)),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAttendanceByMember = async (memberId) => {
  const q = query(
    collection(db, COL),
    where('memberId', '==', memberId),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAllAttendance = async () => {
  const q = query(collection(db, COL), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
