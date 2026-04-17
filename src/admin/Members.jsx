// src/admin/Members.jsx
import React, { useEffect, useState } from 'react';
import { getMembers, addMember, updateMember, deleteMember } from '../services/memberService';
import { getTrainers } from '../services/trainerService';
import { getDietPlans } from '../services/dietService';
import { getPayments } from '../services/paymentService';
import { uploadToCloudinary, getInitials } from '../utils/cloudinaryUpload';
import { toast } from 'react-toastify';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiUpload, FiDownload } from 'react-icons/fi';
import { format, addMonths, differenceInDays } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const PLANS = ['1 Month', '3 Months', '6 Months', '1 Year'];
const PLAN_MONTHS = { '1 Month': 1, '3 Months': 3, '6 Months': 6, '1 Year': 12 };
const BLANK = { name: '', phone: '', age: '', gender: 'Male', joinDate: '', plan: '1 Month', fees: '', trainerId: '', dietPlanId: '', status: 'active' };

export default function Members() {
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [diets, setDiets] = useState([]);
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [exportMenu, setExportMenu] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const load = async () => {
    const [m, t, d, p] = await Promise.all([getMembers(), getTrainers(), getDietPlans(), getPayments()]);
    setMembers(m); setTrainers(t); setDiets(d); setPayments(p); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // ── Helpers ──────────────────────────────────────────────
  const openAdd = () => { setForm(BLANK); setEditing(null); setImgFile(null); setImgPreview(''); setModal(true); };
  const openEdit = (m) => { setForm(m); setEditing(m.id); setImgPreview(m.photoUrl || ''); setImgFile(null); setModal(true); };

  const handleImg = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
  };

  const getMemberPaymentStatus = (memberId) => {
    const mp = payments.filter(p => p.memberId === memberId);
    const hasPending = mp.some(p => p.status === 'pending');
    const hasPaid = mp.some(p => p.status === 'paid');
    if (mp.length === 0) return 'no payment';
    if (hasPending && !hasPaid) return 'pending';
    if (hasPaid && !hasPending) return 'paid';
    return 'partial';
  };

  const getMemberTotalPaid = (memberId) =>
    payments.filter(p => p.memberId === memberId && p.status === 'paid')
      .reduce((s, p) => s + (p.amount || 0), 0);

  const getExpiry = (m) => {
    if (!m.joinDate || !m.plan) return null;
    return addMonths(new Date(m.joinDate), PLAN_MONTHS[m.plan] || 1);
  };

  // ── Export helpers ────────────────────────────────────────
  const buildExportRows = () =>
    filtered.map(m => {
      const exp = getExpiry(m);
      const daysLeft = exp ? differenceInDays(exp, new Date()) : null;
      const trainer = trainers.find(t => t.id === m.trainerId);
      const payStatus = getMemberPaymentStatus(m.id);
      const totalPaid = getMemberTotalPaid(m.id);
      return {
        'Member ID':   m.memberId || '—',
        'Name':        m.name,
        'Phone':       m.phone,
        'Age':         m.age || '—',
        'Gender':      m.gender || '—',
        'Join Date':   m.joinDate ? format(new Date(m.joinDate), 'dd MMM yyyy') : '—',
        'Plan':        m.plan,
        'Expiry':      exp ? format(exp, 'dd MMM yyyy') : '—',
        'Days Left':   daysLeft !== null ? (daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft}d`) : '—',
        'Trainer':     trainer?.name || '—',
        'Fees (₹)':    m.fees || 0,
        'Paid (₹)':    totalPaid,
        'Payment':     payStatus,
        'Status':      m.status,
      };
    });

  const exportExcel = () => {
    const rows = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    // Column widths
    ws['!cols'] = [10,20,14,6,8,14,12,14,16,16,10,10,10,10].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    XLSX.writeFile(wb, `RKFitness_Members_${format(new Date(), 'ddMMMyyyy')}.xlsx`);
    toast.success('Excel exported!');
    setExportMenu(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const rows = buildExportRows();

    // Header
    doc.setFillColor(14, 14, 14);
    doc.rect(0, 0, 297, 20, 'F');
    doc.setTextColor(232, 255, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RK FITNESS — Member Report', 14, 13);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(9);
    doc.text(`Vasagade, Kolhapur  |  Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 180, 13);

    autoTable(doc, {
      startY: 24,
      head: [Object.keys(rows[0] || {})],
      body: rows.map(r => Object.values(r)),
      styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [220, 220, 220], fillColor: [22, 22, 22] },
      headStyles: { fillColor: [30, 30, 30], textColor: [232, 255, 59], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [18, 18, 18] },
      columnStyles: {
        12: { // Payment column
          fontStyle: 'bold',
        }
      },
      didDrawCell: (data) => {
        if (data.column.index === 12 && data.section === 'body') {
          const val = data.cell.raw;
          if (val === 'paid') data.cell.styles.textColor = [34, 197, 94];
          else if (val === 'pending') data.cell.styles.textColor = [249, 115, 22];
          else if (val === 'partial') data.cell.styles.textColor = [59, 130, 246];
        }
      },
      margin: { left: 6, right: 6 },
    });

    // Summary footer
    const finalY = doc.lastAutoTable.finalY + 6;
    const totalFees = filtered.reduce((s, m) => s + (m.fees || 0), 0);
    const totalPaid = filtered.reduce((s, m) => s + getMemberTotalPaid(m.id), 0);
    const paidCount = filtered.filter(m => getMemberPaymentStatus(m.id) === 'paid').length;
    const pendingCount = filtered.filter(m => getMemberPaymentStatus(m.id) === 'pending').length;

    doc.setFontSize(8.5);
    doc.setTextColor(150, 150, 150);
    doc.text(`Total Members: ${filtered.length}   |   Paid: ${paidCount}   |   Pending: ${pendingCount}   |   Total Fees: ₹${totalFees.toLocaleString()}   |   Total Collected: ₹${totalPaid.toLocaleString()}`, 14, finalY);

    doc.save(`RKFitness_Members_${format(new Date(), 'ddMMMyyyy')}.pdf`);
    toast.success('PDF exported!');
    setExportMenu(false);
  };

  // ── Filter ───────────────────────────────────────────────
  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const match = m.name?.toLowerCase().includes(q) || m.phone?.includes(q) || m.memberId?.toLowerCase().includes(q);
    if (filter === 'active')  return match && m.status === 'active';
    if (filter === 'expired') {
      if (!m.joinDate || !m.plan) return false;
      const exp = addMonths(new Date(m.joinDate), PLAN_MONTHS[m.plan] || 1);
      return match && differenceInDays(exp, new Date()) < 0;
    }
    if (filter === 'pending') return match && getMemberPaymentStatus(m.id) === 'pending';
    return match;
  });

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.joinDate) { toast.error('Name, phone, join date required'); return; }
    setSaving(true);
    try {
      let photoUrl = form.photoUrl || '';
      if (imgFile) photoUrl = await uploadToCloudinary(imgFile, 'rk-fitness/members');
      const data = { ...form, photoUrl, fees: Number(form.fees) || 0, age: Number(form.age) || 0 };
      if (editing) { await updateMember(editing, data); toast.success('Member updated'); }
      else { await addMember(data); toast.success('Member added'); }
      setModal(false); load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    await deleteMember(id); toast.success('Deleted'); load();
  };

  const ExpiryBadge = ({ member }) => {
    const exp = getExpiry(member);
    if (!exp) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
    const daysLeft = differenceInDays(exp, new Date());
    return (
      <span className={`badge ${daysLeft < 0 ? 'badge-red' : daysLeft <= 7 ? 'badge-orange' : 'badge-green'}`}>
        {daysLeft < 0 ? `Exp ${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
      </span>
    );
  };

  const PayBadge = ({ memberId }) => {
    const s = getMemberPaymentStatus(memberId);
    const map = { paid: 'badge-green', pending: 'badge-orange', partial: 'badge-blue', 'no payment': 'badge-red' };
    return <span className={`badge ${map[s] || 'badge-accent'}`}>{s}</span>;
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">{members.length} total · {members.filter(m => m.status === 'active').length} active</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Export dropdown */}
          <div style={{ position: 'relative' }}>
            <button className="btn btn-ghost" onClick={() => setExportMenu(v => !v)}>
              <FiDownload /> {isMobile ? '' : 'Export'}
            </button>
            {exportMenu && (
              <div style={{ position: 'absolute', right: 0, top: '110%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, minWidth: 160, zIndex: 50, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                <button onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', width: '100%', color: 'var(--text-primary)', fontSize: '0.88rem', background: 'none', borderBottom: '1px solid var(--border)' }}>
                  📄 Export PDF
                </button>
                <button onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', width: '100%', color: 'var(--text-primary)', fontSize: '0.88rem', background: 'none' }}>
                  📊 Export Excel
                </button>
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={openAdd}><FiPlus /> {isMobile ? 'Add' : 'Add Member'}</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="search-bar" style={{ flex: 1 }}>
          <FiSearch className="search-icon" />
          <input placeholder="Search name, phone, or ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-btns" style={{ display: 'flex', gap: 6, ...(isMobile ? { width: '100%' } : {}) }}>
          {[['all','All'],['active','Active'],['expired','Expired'],['pending','Pending']].map(([val, label]) => (
            <button key={val} className={`btn ${filter === val ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              style={{ flex: isMobile ? 1 : 'unset' }} onClick={() => setFilter(val)}>{label}</button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', val: filtered.length, color: 'var(--text-secondary)' },
          { label: 'Paid', val: filtered.filter(m => getMemberPaymentStatus(m.id) === 'paid').length, color: 'var(--green)' },
          { label: 'Pending', val: filtered.filter(m => getMemberPaymentStatus(m.id) === 'pending').length, color: 'var(--orange)' },
          { label: 'Collected', val: `₹${filtered.reduce((s,m) => s + getMemberTotalPaid(m.id), 0).toLocaleString()}`, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{s.label}: </span>
            <span style={{ color: s.color, fontWeight: 600 }}>{s.val}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">👥</div><p>No members found</p></div>
      ) : isMobile ? (
        /* ── MOBILE cards ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(m => {
            const trainer = trainers.find(t => t.id === m.trainerId);
            return (
              <div key={m.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {m.photoUrl ? (
                    <img src={m.photoUrl} alt={m.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--accent)', flexShrink: 0, border: '2px solid var(--border)' }}>
                      {getInitials(m.name)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{m.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.04em' }}>{m.memberId || '—'}</div>
                      </div>
                      <span className={`badge ${m.status === 'active' ? 'badge-green' : 'badge-red'}`} style={{ flexShrink: 0 }}>{m.status}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 3 }}>{m.phone} · {m.gender}, {m.age}y</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="badge badge-accent">{m.plan}</span>
                      <ExpiryBadge member={m} />
                      <PayBadge memberId={m.id} />
                      {trainer && <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>👤 {trainer.name}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(m)}><FiEdit2 /> Edit</button>
                  <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleDelete(m.id, m.name)}><FiTrash2 /> Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── DESKTOP table ── */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Member</th><th>Phone</th><th>Plan</th>
                  <th>Expiry</th><th>Payment</th><th>Trainer</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => {
                  const trainer = trainers.find(t => t.id === m.trainerId);
                  return (
                    <tr key={m.id}>
                      <td style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--accent)', letterSpacing: '0.04em' }}>
                        {m.memberId || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {m.photoUrl ? (
                            <img src={m.photoUrl} alt={m.name} className="avatar" />
                          ) : (
                            <div className="avatar">{getInitials(m.name)}</div>
                          )}
                          <div>
                            <div style={{ fontWeight: 500 }}>{m.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.gender}, {m.age}y</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{m.phone}</td>
                      <td><span className="badge badge-accent">{m.plan}</span></td>
                      <td><ExpiryBadge member={m} /></td>
                      <td><PayBadge memberId={m.id} /></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{trainer?.name || '—'}</td>
                      <td><span className={`badge ${m.status === 'active' ? 'badge-green' : 'badge-red'}`}>{m.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(m)}><FiEdit2 /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id, m.name)}><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>{editing ? 'Edit Member' : 'Add Member'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}><FiX /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-hover)', border: '2px solid var(--border)', flexShrink: 0 }}>
                {imgPreview ? (
                  <img src={imgPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--accent)' }}>
                    {getInitials(form.name) || '?'}
                  </div>
                )}
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
                  <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Rahul Patil" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input className="form-input" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="9876543210" />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="form-input" type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} placeholder="25" />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Join Date *</label>
                  <input className="form-input" type="date" value={form.joinDate} onChange={e => setForm({...form, joinDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Plan</label>
                  <select className="form-input" value={form.plan} onChange={e => setForm({...form, plan: e.target.value})}>
                    {PLANS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Fees (₹)</label>
                  <input className="form-input" type="number" value={form.fees} onChange={e => setForm({...form, fees: e.target.value})} placeholder="3000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="active">Active</option><option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Assign Trainer</label>
                  <select className="form-input" value={form.trainerId} onChange={e => setForm({...form, trainerId: e.target.value})}>
                    <option value="">None</option>
                    {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Diet Plan</label>
                  <select className="form-input" value={form.dietPlanId} onChange={e => setForm({...form, dietPlanId: e.target.value})}>
                    <option value="">None</option>
                    {diets.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                  {saving ? <span className="spinner" style={{width:16,height:16,borderWidth:2}} /> : null}
                  {saving ? 'Saving...' : (editing ? 'Update' : 'Add Member')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}