// src/admin/Transactions.jsx
import React, { useEffect, useState } from 'react';
import { getPayments } from '../services/paymentService';
import { getMembers } from '../services/memberService';
import { generateReceiptPDF } from '../utils/receipt';
import { toast } from 'react-toastify';
import { FiSearch, FiFileText, FiTrendingUp, FiTrendingDown, FiFilter } from 'react-icons/fi';
import { format, isToday, isYesterday, isThisWeek, isThisMonth, parseISO } from 'date-fns';

const METHOD_ICON = { cash: '💵', UPI: '📲', card: '💳', 'bank transfer': '🏦' };
const METHOD_COLOR = { cash: 'var(--green)', UPI: 'var(--blue)', card: 'var(--accent)', 'bank transfer': 'var(--orange)' };

const getDateLabel = (date) => {
  if (isToday(date))     return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd MMM yyyy');
};

const groupByDate = (payments) => {
  const groups = {};
  payments.forEach(p => {
    const d    = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt || Date.now());
    const key  = format(d, 'yyyy-MM-dd');
    if (!groups[key]) groups[key] = { label: getDateLabel(d), date: d, items: [] };
    groups[key].items.push({ ...p, _date: d });
  });
  return Object.values(groups).sort((a, b) => b.date - a.date);
};

export default function Transactions() {
  const [payments, setPayments] = useState([]);
  const [members,  setMembers]  = useState([]);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');    // all | paid | pending
  const [period,   setPeriod]   = useState('all');    // all | today | week | month
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);     // transaction detail view

  const load = async () => {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([getPayments(), getMembers()]);
      setPayments(p); setMembers(m);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const getMember = (memberId) => members.find(m => m.id === memberId) || null;

  // ── Filters ──────────────────────────────────────────────
  const filtered = payments.filter(p => {
    const name = (p.memberName || getMember(p.memberId)?.name || '').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase())
      || String(p.amount).includes(search)
      || (p.method || '').toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'paid'    && p.status !== 'paid')    return false;
    if (filter === 'pending' && p.status !== 'pending') return false;
    if (period !== 'all') {
      const d = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt || Date.now());
      if (period === 'today' && !isToday(d))         return false;
      if (period === 'week'  && !isThisWeek(d))      return false;
      if (period === 'month' && !isThisMonth(d))     return false;
    }
    return true;
  });

  const groups = groupByDate(filtered);

  // ── Summary stats ─────────────────────────────────────────
  const totalIn      = filtered.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = filtered.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);

  const handleReceipt = (p) => {
    const member = getMember(p.memberId);
    if (!member) { toast.error('Member not found'); return; }
    generateReceiptPDF(member, p);
    toast.success('Receipt downloaded!');
  };

  // ── Transaction detail side panel ────────────────────────
  const DetailPanel = ({ p }) => {
    if (!p) return null;
    const member = getMember(p.memberId);
    const date   = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt || Date.now());
    return (
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 320,
        background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)',
        zIndex: 200, display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.22s ease',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.04em' }}>Transaction</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
        </div>

        {/* Amount hero */}
        <div style={{ padding: '28px 20px 24px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Amount</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', letterSpacing: '0.02em', color: p.status === 'paid' ? 'var(--green)' : 'var(--orange)', lineHeight: 1 }}>
            ₹{Number(p.amount).toLocaleString()}
          </div>
          <span className={`badge ${p.status === 'paid' ? 'badge-green' : 'badge-orange'}`} style={{ marginTop: 12, display: 'inline-flex' }}>
            {p.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
          </span>
        </div>

        {/* Details list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {[
            { label: 'Member',   val: member?.name || p.memberName || '—' },
            { label: 'Member ID',val: member?.memberId || '—' },
            { label: 'Phone',    val: member?.phone || '—' },
            { label: 'Date',     val: format(date, 'dd MMM yyyy') },
            { label: 'Time',     val: format(date, 'hh:mm a') },
            { label: 'Method',   val: `${METHOD_ICON[p.method] || '💰'} ${(p.method || '—').toUpperCase()}` },
            { label: 'Plan',     val: member?.plan || '—' },
            { label: 'Note',     val: p.note || '—' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 16 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{row.label}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, textAlign: 'right' }}>{row.val}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        {p.status === 'paid' && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleReceipt(p)}>
              <FiFileText /> Download Receipt
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div style={{ paddingRight: selected ? 330 : 0, transition: 'padding 0.22s ease' }}>

      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{filtered.length} transactions</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid-2" style={{ marginBottom: 16, maxWidth: 480 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--green)' }}>
            <FiTrendingUp />
          </div>
          <div className="stat-value">₹{totalIn.toLocaleString()}</div>
          <div className="stat-label">Collected</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(249,115,22,0.12)', color: 'var(--orange)' }}>
            <FiTrendingDown />
          </div>
          <div className="stat-value">₹{totalPending.toLocaleString()}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input placeholder="Search member, amount, method..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {/* Status filter */}
          {[['all','All'],['paid','Paid'],['pending','Pending']].map(([val, label]) => (
            <button key={val}
              className={`btn ${filter === val ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => setFilter(val)}>{label}</button>
          ))}
          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
          {/* Period filter */}
          {[['all','All Time'],['today','Today'],['week','This Week'],['month','This Month']].map(([val, label]) => (
            <button key={val}
              className={`btn ${period === val ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => setPeriod(val)}>{label}</button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💳</div>
          <p>No transactions found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {groups.map(group => (
            <div key={group.label}>
              {/* Date header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {group.label}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  ₹{group.items.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()} collected
                </span>
              </div>

              {/* Transactions for this date */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                {group.items.map((p, idx) => {
                  const member  = getMember(p.memberId);
                  const isLast  = idx === group.items.length - 1;
                  const isSelected = selected?.id === p.id;

                  return (
                    <div key={p.id}
                      onClick={() => setSelected(isSelected ? null : p)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '13px 16px',
                        borderBottom: isLast ? 'none' : '1px solid var(--border)',
                        cursor: 'pointer', transition: 'background 0.12s ease',
                        background: isSelected ? 'var(--accent-dim)' : 'transparent',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Method icon bubble */}
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                        background: p.status === 'paid' ? 'rgba(34,197,94,0.12)' : 'rgba(249,115,22,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem',
                      }}>
                        {METHOD_ICON[p.method] || '💰'}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {member?.name || p.memberName || 'Unknown'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 1, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ color: METHOD_COLOR[p.method] || 'var(--text-muted)', fontWeight: 500 }}>
                            {(p.method || '—').toUpperCase()}
                          </span>
                          {p.note && <span>· {p.note}</span>}
                          <span>· {format(p._date, 'hh:mm a')}</span>
                          {member?.memberId && (
                            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{member.memberId}</span>
                          )}
                        </div>
                      </div>

                      {/* Amount + status */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.02em',
                          color: p.status === 'paid' ? 'var(--green)' : 'var(--orange)',
                        }}>
                          {p.status === 'paid' ? '+' : ''}₹{Number(p.amount).toLocaleString()}
                        </div>
                        <span className={`badge ${p.status === 'paid' ? 'badge-green' : 'badge-orange'}`} style={{ marginTop: 4, display: 'inline-flex' }}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selected && <DetailPanel p={selected} />}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'transparent' }}
          onClick={() => setSelected(null)}
        />
      )}
    </div>
  );
}