// src/admin/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { getMembers } from '../services/memberService';
import { getPayments, getMonthlyRevenue } from '../services/paymentService';
import { getTodayAttendance } from '../services/attendanceService';
import { getTrainers } from '../services/trainerService';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FiUsers, FiTrendingUp, FiCalendar, FiUserCheck, FiAlertCircle, FiClock } from 'react-icons/fi';
import { format, addMonths, differenceInDays } from 'date-fns';

const PLAN_MONTHS = { '1 Month': 1, '3 Months': 3, '6 Months': 6, '1 Year': 12 };

export default function Dashboard() {
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [m, p, a, t, rev] = await Promise.all([
          getMembers(), getPayments(), getTodayAttendance(), getTrainers(), getMonthlyRevenue()
        ]);
        setMembers(m); setPayments(p); setTodayAttendance(a); setTrainers(t); setMonthlyRevenue(rev);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const revenueData = Array.from({ length: 6 }, (_, i) => {
    const d = addMonths(new Date(), i - 5);
    const label = format(d, 'MMM');
    const m = d.getMonth(); const y = d.getFullYear();
    const total = payments
      .filter(p => {
        const pd = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
        return pd.getMonth() === m && pd.getFullYear() === y && p.status === 'paid';
      })
      .reduce((s, p) => s + (p.amount || 0), 0);
    return { label, total };
  });

  const expiringSoon = members.filter(m => {
    if (!m.joinDate || !m.plan) return false;
    const months = PLAN_MONTHS[m.plan] || 1;
    const exp = addMonths(new Date(m.joinDate), months);
    const diff = differenceInDays(exp, new Date());
    return diff >= 0 && diff <= 7;
  });

  const activeCount = members.filter(m => m.status === 'active').length;

  const stats = [
    { label: 'Total Members', value: members.length, icon: <FiUsers />, color: 'var(--blue)', sub: `${activeCount} active` },
    { label: 'Monthly Revenue', value: `₹${monthlyRevenue.toLocaleString()}`, icon: <FiTrendingUp />, color: 'var(--accent)', sub: 'This month' },
    { label: "Today's Check-ins", value: todayAttendance.length, icon: <FiCalendar />, color: 'var(--green)', sub: format(new Date(), 'dd MMM') },
    { label: 'Trainers', value: trainers.length, icon: <FiUserCheck />, color: 'var(--orange)', sub: 'Active staff' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 48, height: 48 }} />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{format(new Date(), isMobile ? 'dd MMM yyyy' : 'EEEE, dd MMMM yyyy')}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid-4" style={{ marginBottom: isMobile ? 14 : 24 }}>
        {stats.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="card" style={{ marginBottom: isMobile ? 14 : 20 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.2rem' : '1.3rem', letterSpacing: '0.04em' }}>Revenue Overview</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Last 6 months</div>
        </div>
        <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e8ff3b" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#e8ff3b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="label" stroke="#555" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
            <YAxis stroke="#555" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} width={isMobile ? 50 : 60} />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
              formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']}
            />
            <Area type="monotone" dataKey="total" stroke="#e8ff3b" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Plan distribution — hide on mobile to save space */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }}>
          <div style={{ display: 'none' }} /> {/* placeholder */}
          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.04em', marginBottom: 4 }}>Plan Distribution</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Members by plan</div>
            {['1 Month', '3 Months', '6 Months', '1 Year'].map(plan => {
              const count = members.filter(m => m.plan === plan).length;
              const pct = members.length ? Math.round((count / members.length) * 100) : 0;
              return (
                <div key={plan} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 5, color: 'var(--text-secondary)' }}>
                    <span>{plan}</span><span style={{ color: 'var(--accent)' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--border)', borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 4, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expiring soon + Today attendance */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 14 : 20 }}>
        {/* Expiring soon */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <FiAlertCircle style={{ color: 'var(--orange)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.1rem' : '1.3rem', letterSpacing: '0.04em' }}>Expiring Soon</span>
            {expiringSoon.length > 0 && <span className="badge badge-orange">{expiringSoon.length}</span>}
          </div>
          {expiringSoon.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="empty-icon">✅</div>
              <p>No plans expiring this week</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {expiringSoon.slice(0, 6).map(m => {
                const months = PLAN_MONTHS[m.plan] || 1;
                const exp = addMonths(new Date(m.joinDate), months);
                const diff = differenceInDays(exp, new Date());
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{m.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.plan} · {m.phone}</div>
                    </div>
                    <span className={`badge ${diff <= 3 ? 'badge-red' : 'badge-orange'}`}>
                      {diff === 0 ? 'Today' : `${diff}d left`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's check-ins */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <FiClock style={{ color: 'var(--green)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.1rem' : '1.3rem', letterSpacing: '0.04em' }}>Today's Check-ins</span>
            <span className="badge badge-green">{todayAttendance.length}</span>
          </div>
          {todayAttendance.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="empty-icon">📭</div>
              <p>No check-ins recorded today</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
              {todayAttendance.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, flex: 1 }}>{a.memberName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {a.date?.toDate ? format(a.date.toDate(), 'hh:mm a') : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
