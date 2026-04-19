// src/utils/receipt.js
import jsPDF from 'jspdf';
import { format, addMonths } from 'date-fns';

const PLAN_MONTHS = { '1 Month': 1, '3 Months': 3, '6 Months': 6, '1 Year': 12 };

export const generateReceiptPDF = (member, payment) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });
  const W = 148; // A5 width

  const payDate = payment.createdAt?.toDate
    ? payment.createdAt.toDate()
    : new Date();

  const joinDate = member.joinDate ? new Date(member.joinDate) : payDate;
  const months = PLAN_MONTHS[member.plan] || 1;
  const expiryDate = addMonths(joinDate, months);
  const receiptNo = payment.receiptNo || payment.id?.slice(-6).toUpperCase() || 'XXXXXX';

  // ── Background ────────────────────────────────────────
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, W, 210, 'F');

  // ── Header bar ────────────────────────────────────────
  doc.setFillColor(232, 255, 59);
  doc.rect(0, 0, W, 28, 'F');

  doc.setTextColor(10, 10, 10);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RK FITNESS', 10, 12);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Vasagade, Kolhapur  |  Gym Management System', 10, 19);
  doc.text('PAYMENT RECEIPT', W - 10, 12, { align: 'right' });
  doc.setFontSize(7);
  doc.text(`Receipt No: #${receiptNo}`, W - 10, 19, { align: 'right' });

  // ── Member info box ───────────────────────────────────
  doc.setFillColor(22, 22, 22);
  doc.roundedRect(8, 34, W - 16, 42, 3, 3, 'F');

  doc.setTextColor(136, 136, 136);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('MEMBER DETAILS', 14, 42);

  const memberFields = [
    ['Name',      member.name],
    ['Member ID', member.memberId || '—'],
    ['Phone',     member.phone],
    ['Gender',    `${member.gender || '—'}, Age: ${member.age || '—'}`],
  ];

  doc.setFont('helvetica', 'normal');
  memberFields.forEach(([label, value], i) => {
    const y = 50 + i * 7;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text(label, 14, y);
    doc.setTextColor(220, 220, 220);
    doc.setFontSize(8);
    doc.text(String(value || '—'), 50, y);
  });

  // ── Payment details box ───────────────────────────────
  doc.setFillColor(22, 22, 22);
  doc.roundedRect(8, 82, W - 16, 70, 3, 3, 'F');

  doc.setTextColor(136, 136, 136);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS', 14, 90);

  const payFields = [
    ['Plan',           member.plan],
    ['Join Date',      format(joinDate, 'dd MMM yyyy')],
    ['Expiry Date',    format(expiryDate, 'dd MMM yyyy')],
    ['Payment Date',   format(payDate, 'dd MMM yyyy, hh:mm a')],
    ['Payment Method', (payment.method || '—').toUpperCase()],
    ['Status',         (payment.status || '—').toUpperCase()],
    ['Note',           payment.note || '—'],
  ];

  doc.setFont('helvetica', 'normal');
  payFields.forEach(([label, value], i) => {
    const y = 98 + i * 7.5;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text(label, 14, y);
    doc.setTextColor(220, 220, 220);
    doc.setFontSize(8);
    doc.text(String(value || '—'), 65, y);
  });

  // ── Amount highlight ──────────────────────────────────
  doc.setFillColor(232, 255, 59);
  doc.roundedRect(8, 158, W - 16, 22, 3, 3, 'F');

  doc.setTextColor(10, 10, 10);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('AMOUNT PAID', 14, 167);
  doc.setFontSize(16);
  doc.text(`Rs. ${Number(payment.amount || 0).toLocaleString()}`, W - 14, 168, { align: 'right' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`in words: ${amountInWords(payment.amount)} Rupees Only`, 14, 174);

  // ── Footer ────────────────────────────────────────────
  doc.setFillColor(18, 18, 18);
  doc.rect(0, 186, W, 24, 'F');

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(7);
  doc.text('Thank you for being a part of RK Fitness!', W / 2, 193, { align: 'center' });
  doc.text('This is a computer-generated receipt.', W / 2, 199, { align: 'center' });
  doc.setTextColor(232, 255, 59);
  doc.text('RK Fitness, Vasagade, Kolhapur', W / 2, 206, { align: 'center' });

  doc.save(`Receipt_${member.name.replace(/ /g,'_')}_${receiptNo}.pdf`);
};

// Simple number to words for amounts up to 99999
const amountInWords = (num) => {
  const n = Number(num) || 0;
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (n === 0) return 'Zero';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
  if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + amountInWords(n%100) : '');
  if (n < 100000) return amountInWords(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + amountInWords(n%1000) : '');
  return n.toString();
};