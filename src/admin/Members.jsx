// src/admin/Members.jsx
import React, { useEffect, useState } from 'react';
import { getMembers, addMember, updateMember, deleteMember } from '../services/memberService';
import { getTrainers } from '../services/trainerService';
import { getDietPlans } from '../services/dietService';
import { getPayments, addPayment, updatePayment } from '../services/paymentService';
import { uploadToCloudinary, getInitials } from '../utils/cloudinaryUpload';
import { sendAdmissionMessage, sendRenewalMessage, sendExpiryReminderMessage } from '../utils/whatsapp';
import { generateReceiptPDF } from '../utils/receipt';
import { toast } from 'react-toastify';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2,
  FiX, FiUpload, FiDownload, FiRefreshCw,
  FiChevronDown, FiChevronUp, FiFileText, FiCheckCircle
} from 'react-icons/fi';
import { format, addMonths, differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const PLANS       = ['1 Month', '3 Months', '6 Months', '1 Year'];
const PLAN_DAYS   = { '1 Month': 30, '3 Months': 90, '6 Months': 180, '1 Year': 365 };
const PLAN_MONTHS = { '1 Month': 1,  '3 Months': 3,  '6 Months': 6,   '1 Year': 12  };
const METHODS     = ['cash', 'UPI', 'card', 'bank transfer'];
const BLANK = {
  name:'', phone:'', age:'', gender:'Male',
  joinDate:'', plan:'1 Month', fees:'',
  trainerId:'', dietPlanId:'', status:'active'
};

// ── Correct expiry: joinDate + exact plan days ────────────
const calcExpiry = (joinDateStr, plan) => {
  if (!joinDateStr || !plan) return null;
  // Parse as local date (avoid timezone shift)
  const join = startOfDay(parseISO(joinDateStr));
  return addMonths(join, PLAN_MONTHS[plan] || 1);
};

const calcDaysLeft = (joinDateStr, plan) => {
  const exp = calcExpiry(joinDateStr, plan);
  if (!exp) return null;
  return differenceInCalendarDays(exp, startOfDay(new Date()));
};

export default function Members() {
  const [members,    setMembers]    = useState([]);
  const [trainers,   setTrainers]   = useState([]);
  const [diets,      setDiets]      = useState([]);
  const [payments,   setPayments]   = useState([]);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('all');
  const [loading,    setLoading]    = useState(true);
  const [exportMenu, setExportMenu] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Add/Edit modal
  const [modal,      setModal]      = useState(false);
  const [form,       setForm]       = useState(BLANK);
  const [editing,    setEditing]    = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [imgFile,    setImgFile]    = useState(null);
  const [imgPreview, setImgPreview] = useState('');

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // Renew modal
  const [renewModal,  setRenewModal]  = useState(false);
  const [renewTarget, setRenewTarget] = useState(null);
  const [renewForm,   setRenewForm]   = useState({ plan:'1 Month', fees:'', method:'cash' });
  const [renewing,    setRenewing]    = useState(false);

  // Quick pay modal
  const [payModal,  setPayModal]  = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [payMethod, setPayMethod] = useState('cash');
  const [paying,    setPaying]    = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // ── Load ─────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const [m, t, d, p] = await Promise.all([
        getMembers(), getTrainers(), getDietPlans(), getPayments()
      ]);
      setMembers(m); setTrainers(t); setDiets(d); setPayments(p);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // ── Payment helpers ──────────────────────────────────────
  const memberPayments = (memberId) =>
    payments.filter(p => p.memberId === memberId)
      .sort((a, b) => {
        const aD = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const bD = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return bD - aD;
      });

  const getPayStatus = (memberId) => {
    const mp = memberPayments(memberId);
    if (!mp.length) return 'no payment';
    const hasPaid = mp.some(p => p.status === 'paid');
    const hasPend = mp.some(p => p.status === 'pending');
    if (hasPaid && !hasPend) return 'paid';
    if (hasPend && !hasPaid) return 'pending';
    return 'partial';
  };

  const getTotalPaid = (memberId) =>
    memberPayments(memberId)
      .filter(p => p.status === 'paid')
      .reduce((s, p) => s + (p.amount || 0), 0);

  // ── Add / Edit ───────────────────────────────────────────
  const openAdd  = () => { setForm(BLANK); setEditing(null); setImgFile(null); setImgPreview(''); setModal(true); };
  const openEdit = (m) => { setForm({ ...m }); setEditing(m.id); setImgPreview(m.photoUrl || ''); setImgFile(null); setModal(true); };

  const handleImg = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImgFile(f); setImgPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.joinDate) { toast.error('Name, phone, join date required'); return; }
    setSaving(true);
    try {
      let photoUrl = form.photoUrl || '';
      if (imgFile) photoUrl = await uploadToCloudinary(imgFile, 'rk-fitness/members');
      const data = { ...form, photoUrl, fees: Number(form.fees) || 0, age: Number(form.age) || 0 };
      if (editing) {
        await updateMember(editing, data);
        toast.success('Member updated');
      } else {
        await addMember(data);
        toast.success('Member added! Tap 📱 to send WhatsApp admission message.');
      }
      setModal(false); load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  // ── Delete ───────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMember(deleteTarget.id);
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null); load();
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  // ── Renew ────────────────────────────────────────────────
  const openRenew = (member) => {
    setRenewTarget(member);
    setRenewForm({ plan: member.plan || '1 Month', fees: member.fees || '', method: 'cash' });
    setRenewModal(true);
  };

  const handleRenew = async () => {
    if (!renewForm.fees) { toast.error('Enter renewal fees'); return; }
    setRenewing(true);
    try {
      const today     = format(new Date(), 'yyyy-MM-dd');
      const newExpiry = format(addMonths(parseISO(today), PLAN_MONTHS[renewForm.plan] || 1), 'dd MMM yyyy');

      await updateMember(renewTarget.id, {
        ...renewTarget, plan: renewForm.plan,
        fees: Number(renewForm.fees), joinDate: today, status: 'active',
      });
      await addPayment({
        memberId:   renewTarget.id,
        memberName: renewTarget.name,
        amount:     Number(renewForm.fees),
        method:     renewForm.method,
        status:     'paid',
        note:       `Renewal — ${renewForm.plan}`,
      });

      toast.success(`${renewTarget.name} renewed till ${newExpiry}!`);
      setRenewModal(false);
      load();

      // WhatsApp renewal
      sendRenewalMessage(
        { ...renewTarget, plan: renewForm.plan, fees: Number(renewForm.fees) },
        format(new Date(), 'dd MMM yyyy'),
        newExpiry
      );
    } catch (err) { toast.error(err.message); }
    finally { setRenewing(false); }
  };

  // ── WhatsApp ─────────────────────────────────────────────
  const sendAdmissionWA = (member) => {
    if (!member.phone) { toast.error('No phone number'); return; }
    const exp = calcExpiry(member.joinDate, member.plan);
    sendAdmissionMessage(member, exp ? format(exp, 'dd MMM yyyy') : '—');
  };

  const sendExpiryWA = (member) => {
    if (!member.phone) { toast.error('No phone number'); return; }
    const exp      = calcExpiry(member.joinDate, member.plan);
    const daysLeft = calcDaysLeft(member.joinDate, member.plan);
    if (exp === null) { toast.error('No expiry date'); return; }
    sendExpiryReminderMessage(member, format(exp, 'dd MMM yyyy'), Math.max(0, daysLeft));
    toast.success('WhatsApp expiry reminder opened!');
  };

  // ── Quick pay ────────────────────────────────────────────
  const openQuickPay = (member, payment) => {
    setPayTarget({ member, payment });
    setPayMethod('cash');
    setPayModal(true);
  };

  const handleQuickPay = async () => {
    setPaying(true);
    try {
      await updatePayment(payTarget.payment.id, { ...payTarget.payment, status: 'paid', method: payMethod });
      toast.success('Marked as paid!');
      setPayModal(false); load();
    } catch (err) { toast.error(err.message); }
    finally { setPaying(false); }
  };

  // ── Receipt ──────────────────────────────────────────────
  const downloadReceipt = (member, payment) => {
    generateReceiptPDF(member, payment);
    toast.success('Receipt downloaded!');
  };

  // ── Export ───────────────────────────────────────────────
  const buildRows = () =>
    filtered.map(m => {
      const exp      = calcExpiry(m.joinDate, m.plan);
      const daysLeft = calcDaysLeft(m.joinDate, m.plan);
      const trainer  = trainers.find(t => t.id === m.trainerId);
      return {
        'Member ID': m.memberId || '—',
        'Name':      m.name,
        'Phone':     m.phone,
        'Age':       m.age || '—',
        'Gender':    m.gender || '—',
        'Join Date': m.joinDate ? format(parseISO(m.joinDate), 'dd MMM yyyy') : '—',
        'Plan':      m.plan,
        'Expiry':    exp ? format(exp, 'dd MMM yyyy') : '—',
        'Days Left': daysLeft !== null
          ? (daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft}d remaining`)
          : '—',
        'Trainer':   trainer?.name || '—',
        'Fees (₹)':  m.fees || 0,
        'Paid (₹)':  getTotalPaid(m.id),
        'Payment':   getPayStatus(m.id),
        'Status':    m.status,
      };
    });

  const exportExcel = () => {
    const rows = buildRows();
    const ws   = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [10,20,14,6,8,14,12,14,18,16,10,10,10,10].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    XLSX.writeFile(wb, `RKFitness_Members_${format(new Date(), 'ddMMMyyyy')}.xlsx`);
    toast.success('Excel exported!'); setExportMenu(false);
  };

  const exportPDF = () => {
    const rows = buildRows();
    if (!rows.length) { toast.error('No members to export'); return; }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFillColor(14, 14, 14); doc.rect(0, 0, 297, 20, 'F');
    doc.setTextColor(232, 255, 59); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('RK FITNESS — Member Report', 14, 13);
    doc.setTextColor(150, 150, 150); doc.setFontSize(9);
    doc.text(`Vasagade, Kolhapur  |  Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 160, 13);
    autoTable(doc, {
      startY: 24,
      head:   [Object.keys(rows[0])],
      body:   rows.map(r => Object.values(r)),
      styles: { fontSize: 7, cellPadding: 2, textColor: [220, 220, 220], fillColor: [22, 22, 22] },
      headStyles: { fillColor: [30, 30, 30], textColor: [232, 255, 59], fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [18, 18, 18] },
      margin: { left: 4, right: 4 },
    });
    const fy  = doc.lastAutoTable.finalY + 6;
    const tf  = filtered.reduce((s, m) => s + (m.fees || 0), 0);
    const tp  = filtered.reduce((s, m) => s + getTotalPaid(m.id), 0);
    const pc  = filtered.filter(m => getPayStatus(m.id) === 'paid').length;
    const pnd = filtered.filter(m => getPayStatus(m.id) === 'pending').length;
    doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text(`Total: ${filtered.length}  |  Paid: ${pc}  |  Pending: ${pnd}  |  Total Fees: ₹${tf.toLocaleString()}  |  Collected: ₹${tp.toLocaleString()}`, 14, fy);
    doc.save(`RKFitness_Members_${format(new Date(), 'ddMMMyyyy')}.pdf`);
    toast.success('PDF exported!'); setExportMenu(false);
  };

  // ── Filter ───────────────────────────────────────────────
  const filtered = members.filter(m => {
    const q     = search.toLowerCase();
    const match = m.name?.toLowerCase().includes(q)
      || m.phone?.includes(q)
      || m.memberId?.toLowerCase().includes(q);
    if (filter === 'active')  return match && m.status === 'active';
    if (filter === 'expired') {
      const d = calcDaysLeft(m.joinDate, m.plan);
      return match && d !== null && d < 0;
    }
    if (filter === 'expiring') {
      const d = calcDaysLeft(m.joinDate, m.plan);
      return match && d !== null && d >= 0 && d <= 3;
    }
    if (filter === 'pending') return match && getPayStatus(m.id) === 'pending';
    return match;
  });

  // ── Sub-components ───────────────────────────────────────
  const ExpiryBadge = ({ member }) => {
    const d = calcDaysLeft(member.joinDate, member.plan);
    if (d === null) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
    const cls = d < 0 ? 'badge-red' : d <= 3 ? 'badge-red' : d <= 7 ? 'badge-orange' : 'badge-green';
    const txt = d < 0 ? `Expired ${Math.abs(d)}d ago` : d === 0 ? 'Expires Today' : `${d} days left`;
    return <span className={`badge ${cls}`}>{txt}</span>;
  };

  const PayBadge = ({ memberId }) => {
    const s   = getPayStatus(memberId);
    const map = { paid: 'badge-green', pending: 'badge-orange', partial: 'badge-blue', 'no payment': 'badge-red' };
    return <span className={`badge ${map[s] || 'badge-accent'}`}>{s}</span>;
  };

  const PaymentPanel = ({ member }) => {
    const mp         = memberPayments(member.id);
    const pendingMps = mp.filter(p => p.status === 'pending');
    return (
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Payment History</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {pendingMps.length > 0 && (
              <span className="badge badge-orange">⚠ {pendingMps.length} pending</span>
            )}
            <span style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>
              Collected: ₹{getTotalPaid(member.id).toLocaleString()}
            </span>
          </div>
        </div>

        {mp.length === 0 ? (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
            No payment records yet
          </div>
        ) : (
          mp.map(p => {
            const date = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt || Date.now());
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                background: 'var(--bg-hover)', borderRadius: 8, padding: '9px 12px',
                border: p.status === 'pending' ? '1px solid rgba(249,115,22,0.3)' : '1px solid transparent',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: p.status === 'paid' ? 'var(--green)' : 'var(--orange)' }}>
                    ₹{Number(p.amount).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>
                    {format(date, 'dd MMM yyyy')} · {(p.method || '').toUpperCase()}
                    {p.note ? ` · ${p.note}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
                  <span className={`badge ${p.status === 'paid' ? 'badge-green' : 'badge-orange'}`}>{p.status}</span>
                  {p.status === 'pending' && (
                    <button className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--green)', borderColor: 'rgba(34,197,94,0.3)', padding: '4px 8px', minHeight: 28, fontSize: '0.75rem' }}
                      onClick={() => openQuickPay(member, p)}>
                      <FiCheckCircle /> Mark Paid
                    </button>
                  )}
                  {p.status === 'paid' && (
                    <button className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px', minHeight: 28 }}
                      title="Download Receipt"
                      onClick={() => downloadReceipt(member, p)}>
                      <FiFileText />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div onClick={() => exportMenu && setExportMenu(false)}>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">
            {members.length} total · {members.filter(m => m.status === 'active').length} active
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button className="btn btn-ghost" onClick={() => setExportMenu(v => !v)}>
              <FiDownload /> {!isMobile && 'Export'}
            </button>
            {exportMenu && (
              <div style={{
                position: 'absolute', right: 0, top: '110%',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 10, minWidth: 160, zIndex: 50,
                overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}>
                <button onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', width: '100%', color: 'var(--text-primary)', fontSize: '0.88rem', background: 'none', borderBottom: '1px solid var(--border)' }}>
                  📄 Export PDF
                </button>
                <button onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', width: '100%', color: 'var(--text-primary)', fontSize: '0.88rem', background: 'none' }}>
                  📊 Export Excel
                </button>
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <FiPlus /> {isMobile ? 'Add' : 'Add Member'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="search-bar" style={{ flex: 1 }}>
          <FiSearch className="search-icon" />
          <input placeholder="Search name, phone, or ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-btns" style={{ display: 'flex', gap: 6, ...(isMobile ? { width: '100%' } : {}) }}>
          {[['all','All'],['active','Active'],['expiring','⚠ Expiring'],['expired','Expired'],['pending','Pending']].map(([val, label]) => (
            <button key={val}
              className={`btn ${filter === val ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              style={{ flex: isMobile ? 1 : 'unset' }}
              onClick={() => setFilter(val)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Total',     val: filtered.length,                                                             color: 'var(--text-secondary)' },
          { label: 'Paid',      val: filtered.filter(m => getPayStatus(m.id) === 'paid').length,                  color: 'var(--green)' },
          { label: 'Pending',   val: filtered.filter(m => getPayStatus(m.id) === 'pending').length,               color: 'var(--orange)' },
          { label: 'Expiring ≤3d', val: members.filter(m => { const d = calcDaysLeft(m.joinDate, m.plan); return d !== null && d >= 0 && d <= 3; }).length, color: 'var(--red)' },
          { label: 'Collected', val: `₹${filtered.reduce((s, m) => s + getTotalPaid(m.id), 0).toLocaleString()}`, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: '0.79rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{s.label}: </span>
            <span style={{ color: s.color, fontWeight: 600 }}>{s.val}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">👥</div><p>No members found</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(m => {
            const trainer      = trainers.find(t => t.id === m.trainerId);
            const isExpanded   = expandedId === m.id;
            const daysLeft     = calcDaysLeft(m.joinDate, m.plan);
            const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
            const pendingCount = memberPayments(m.id).filter(p => p.status === 'pending').length;

            return (
              <div key={m.id} style={{
                background: 'var(--bg-card)',
                border: `1px solid ${isExpiringSoon ? 'rgba(255,68,68,0.3)' : 'var(--border)'}`,
                borderRadius: 12, padding: '14px',
                transition: 'var(--transition)',
              }}>
                {/* Top row */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {m.photoUrl ? (
                    <img src={m.photoUrl} alt={m.name} style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--accent)', flexShrink: 0, border: '2px solid var(--border)' }}>
                      {getInitials(m.name)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em' }}>{m.memberId || '—'}</div>
                      </div>
                      <span className={`badge ${m.status === 'active' ? 'badge-green' : 'badge-red'}`} style={{ flexShrink: 0 }}>{m.status}</span>
                    </div>
                    <div style={{ fontSize: '0.79rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                      {m.phone} · {m.gender}, {m.age}y
                      {trainer && <span> · 👤 {trainer.name}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="badge badge-accent">{m.plan}</span>
                      <ExpiryBadge member={m} />
                      <PayBadge memberId={m.id} />
                      {pendingCount > 0 && <span className="badge badge-orange">⚠ {pendingCount} pending</span>}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr 1fr 1fr' : 'repeat(6, auto)',
                  gap: 6, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)'
                }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(m)}>
                    <FiEdit2 /> Edit
                  </button>
                  <button className="btn btn-ghost btn-sm"
                    style={{ color: '#25d366', borderColor: 'rgba(37,211,102,0.25)' }}
                    onClick={() => sendAdmissionWA(m)}>
                    📱 Admit
                  </button>
                  {isExpiringSoon && (
                    <button className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--red)', borderColor: 'rgba(255,68,68,0.3)' }}
                      onClick={() => sendExpiryWA(m)}>
                      ⚠ Expiry WA
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--blue)', borderColor: 'rgba(59,130,246,0.25)' }}
                    onClick={() => openRenew(m)}>
                    <FiRefreshCw /> Renew
                  </button>
                  <button className="btn btn-ghost btn-sm"
                    style={{ color: isExpanded ? 'var(--accent)' : 'var(--text-secondary)' }}
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}>
                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    Payments
                  </button>
                  <button className="btn btn-danger btn-sm"
                    onClick={() => setDeleteTarget(m)}>
                    <FiTrash2 /> Delete
                  </button>
                </div>

                {/* Payment panel */}
                {isExpanded && <PaymentPanel member={m} />}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ ADD/EDIT MODAL ══ */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>{editing ? 'Edit Member' : 'Add Member'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}><FiX /></button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-hover)', border: '2px solid var(--border)', flexShrink: 0 }}>
                {imgPreview
                  ? <img src={imgPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--accent)' }}>{getInitials(form.name) || '?'}</div>
                }
              </div>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                <FiUpload /> Upload Photo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImg} />
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Rahul Patil" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input className="form-input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="form-input" type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="25" />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Join Date *</label>
                  <input className="form-input" type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Plan</label>
                  <select className="form-input" value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}>
                    {PLANS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              {/* Expiry preview */}
              {form.joinDate && form.plan && (
                <div style={{ background: 'var(--accent-dim)', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', color: 'var(--accent)' }}>
                  📅 Membership valid till: <strong>
                    {format(addMonths(parseISO(form.joinDate), PLAN_MONTHS[form.plan] || 1), 'dd MMM yyyy')}
                  </strong>
                  &nbsp;({PLAN_DAYS[form.plan]} days)
                </div>
              )}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Fees (₹)</label>
                  <input className="form-input" type="number" value={form.fees} onChange={e => setForm({ ...form, fees: e.target.value })} placeholder="3000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Assign Trainer</label>
                  <select className="form-input" value={form.trainerId} onChange={e => setForm({ ...form, trainerId: e.target.value })}>
                    <option value="">None</option>
                    {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Diet Plan</label>
                  <select className="form-input" value={form.dietPlanId} onChange={e => setForm({ ...form, dietPlanId: e.target.value })}>
                    <option value="">None</option>
                    {diets.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                  {saving && <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
                  {saving ? 'Saving...' : editing ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM MODAL ══ */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }}>
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🗑️</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', letterSpacing: '0.04em', marginBottom: 8 }}>
                Delete Member?
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                You are about to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.name}</strong> ({deleteTarget.memberId}).
                <br />This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={confirmDelete} disabled={deleting}>
                {deleting && <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ RENEW MODAL ══ */}
      {renewModal && renewTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setRenewModal(false)}>
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Renew Membership</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setRenewModal(false)}><FiX /></button>
            </div>
            <div style={{ background: 'var(--bg-hover)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontWeight: 600 }}>{renewTarget.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, marginTop: 2 }}>{renewTarget.memberId}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                📞 {renewTarget.phone} · Current: <strong>{renewTarget.plan}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Current expiry: {(() => { const exp = calcExpiry(renewTarget.joinDate, renewTarget.plan); return exp ? format(exp, 'dd MMM yyyy') : '—'; })()}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">New Plan</label>
                  <select className="form-input" value={renewForm.plan} onChange={e => setRenewForm({ ...renewForm, plan: e.target.value })}>
                    {PLANS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fees (₹) *</label>
                  <input className="form-input" type="number" value={renewForm.fees} onChange={e => setRenewForm({ ...renewForm, fees: e.target.value })} placeholder="3000" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-input" value={renewForm.method} onChange={e => setRenewForm({ ...renewForm, method: e.target.value })}>
                  {METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: 'var(--accent)' }}>
                📅 New expiry: <strong>
                  {format(addMonths(new Date(), PLAN_MONTHS[renewForm.plan] || 1), 'dd MMM yyyy')}
                </strong> · {PLAN_DAYS[renewForm.plan]} days
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                  📱 WhatsApp renewal message will open after saving
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setRenewModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleRenew} disabled={renewing}>
                  {renewing && <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
                  {renewing ? 'Renewing...' : 'Renew & WhatsApp'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ QUICK PAY MODAL ══ */}
      {payModal && payTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPayModal(false)}>
          <div className="modal-box" style={{ maxWidth: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Mark as Paid</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setPayModal(false)}><FiX /></button>
            </div>
            <div style={{ background: 'var(--bg-hover)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontWeight: 600 }}>{payTarget.member.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Amount: <strong style={{ color: 'var(--orange)', fontSize: '1.1rem' }}>₹{Number(payTarget.payment.amount).toLocaleString()}</strong>
              </div>
              {payTarget.payment.note && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{payTarget.payment.note}</div>}
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Payment Method</label>
              <select className="form-input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                {METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPayModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, background: 'var(--green)' }} onClick={handleQuickPay} disabled={paying}>
                {paying && <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />}
                {paying ? 'Saving...' : '✓ Confirm Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}