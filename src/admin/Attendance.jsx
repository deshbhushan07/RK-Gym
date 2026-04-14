// src/admin/Attendance.jsx
import React, { useEffect, useState } from 'react';
import { markAttendance, getTodayAttendance, getAllAttendance } from '../services/attendanceService';
import { getMembers } from '../services/memberService';
import { toast } from 'react-toastify';
import { FiSearch, FiCheckCircle, FiCalendar, FiUsers } from 'react-icons/fi';
import { format } from 'date-fns';
import { getInitials } from '../utils/cloudinaryUpload';

export default function Attendance() {
  const [members, setMembers] = useState([]);
  const [todayAtt, setTodayAtt] = useState([]);
  const [allAtt, setAllAtt] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState('');
  const [tab, setTab] = useState('mark');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const load = async () => {
    const [m, t, a] = await Promise.all([getMembers(), getTodayAttendance(), getAllAttendance()]);
    setMembers(m.filter(m => m.status === 'active'));
    setTodayAtt(t); setAllAtt(a); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const isMarkedToday = (memberId) => todayAtt.some(a => a.memberId === memberId);

  const handleMark = async (member) => {
    setMarking(member.id);
    try {
      await markAttendance(member.id, member.name);
      toast.success(`✅ ${member.name} checked in`);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setMarking(''); }
  };

  const filteredMembers = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.phone?.includes(search)
  );

  // Sort: unmarked first on mobile for quick access
  const sortedMembers = isMobile
    ? [...filteredMembers].sort((a, b) => {
        const aMarked = isMarkedToday(a.id) ? 1 : 0;
        const bMarked = isMarkedToday(b.id) ? 1 : 0;
        return aMarked - bMarked;
      })
    : filteredMembers;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">
            {format(new Date(), isMobile ? 'dd MMM yyyy' : 'EEEE, dd MMMM yyyy')} · {todayAtt.length} in today
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: isMobile ? 14 : 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--green)' }}><FiCheckCircle /></div>
          <div className="stat-value">{todayAtt.length}</div>
          <div className="stat-label">Today's Check-ins</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--blue)' }}><FiUsers /></div>
          <div className="stat-value">{members.length}</div>
          <div className="stat-label">Active Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(232,255,59,0.12)', color: 'var(--accent)' }}><FiCalendar /></div>
          <div className="stat-value">{allAtt.length}</div>
          <div className="stat-label">Total Records</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: isMobile ? 14 : 20 }}>
        {[['mark', 'Mark Attendance'], ['history', 'History']].map(([key, label]) => (
          <button key={key} className={`btn ${tab === key ? 'btn-primary' : 'btn-ghost'}`}
            style={isMobile ? { flex: 1 } : {}}
            onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'mark' && (
        <>
          <div style={{ marginBottom: isMobile ? 12 : 16 }}>
            <div className="search-bar">
              <FiSearch className="search-icon" />
              <input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
          ) : isMobile ? (
            /* ── MOBILE: tall tap-friendly rows ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedMembers.map(m => {
                const marked = isMarkedToday(m.id);
                const isLoading = marking === m.id;
                return (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: marked ? 'rgba(34,197,94,0.06)' : 'var(--bg-card)',
                    border: `1px solid ${marked ? 'rgba(34,197,94,0.25)' : 'var(--border)'}`,
                    borderRadius: 12, padding: '12px 14px',
                    minHeight: 68,
                    transition: 'var(--transition)',
                  }}>
                    {/* Avatar */}
                    {m.photoUrl ? (
                      <img src={m.photoUrl} alt={m.name} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: marked ? 'rgba(34,197,94,0.15)' : 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1rem', color: marked ? 'var(--green)' : 'var(--accent)', flexShrink: 0 }}>
                        {getInitials(m.name)}
                      </div>
                    )}
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{m.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 1 }}>{m.plan}</div>
                    </div>
                    {/* Action */}
                    {marked ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <FiCheckCircle style={{ color: 'var(--green)', fontSize: '1.4rem' }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--green)', fontWeight: 600 }}>IN</span>
                      </div>
                    ) : (
                      <button
                        style={{
                          background: 'var(--accent)', color: '#0a0a0a',
                          border: 'none', borderRadius: 10,
                          padding: '10px 16px', fontSize: '0.85rem', fontWeight: 700,
                          minWidth: 84, minHeight: 44,
                          opacity: isLoading ? 0.7 : 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          flexShrink: 0,
                        }}
                        onClick={() => handleMark(m)}
                        disabled={isLoading}
                      >
                        {isLoading
                          ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: '#0a0a0a', borderColor: 'rgba(0,0,0,0.2)' }} />
                          : 'Check In'
                        }
                      </button>
                    )}
                  </div>
                );
              })}
              {sortedMembers.length === 0 && (
                <div className="empty-state"><div className="empty-icon">👥</div><p>No active members found</p></div>
              )}
            </div>
          ) : (
            /* ── DESKTOP: grid cards ── */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {filteredMembers.map(m => {
                const marked = isMarkedToday(m.id);
                const isLoading = marking === m.id;
                return (
                  <div key={m.id} className="card" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px',
                    border: marked ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border)',
                    background: marked ? 'rgba(34,197,94,0.04)' : 'var(--bg-card)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt={m.name} className="avatar" />
                      ) : (
                        <div className="avatar">{getInitials(m.name)}</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.92rem' }}>{m.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.plan}</div>
                      </div>
                    </div>
                    {marked ? (
                      <span className="badge badge-green"><FiCheckCircle /> In</span>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => handleMark(m)} disabled={isLoading} style={{ minWidth: 70 }}>
                        {isLoading ? <span className="spinner" style={{width:14,height:14,borderWidth:2}} /> : 'Check In'}
                      </button>
                    )}
                  </div>
                );
              })}
              {filteredMembers.length === 0 && (
                <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                  <div className="empty-icon">👥</div><p>No active members found</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        isMobile ? (
          /* ── MOBILE history: card list ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allAtt.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📅</div><p>No attendance records</p></div>
            ) : allAtt.slice(0, 100).map(a => {
              const date = a.date?.toDate ? a.date.toDate() : new Date();
              return (
                <div key={a.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{a.memberName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {format(date, 'dd MMM yyyy')} · {format(date, 'hh:mm a')}
                    </div>
                  </div>
                  <span className="badge badge-green">{a.status || 'present'}</span>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── DESKTOP history: table ── */
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {allAtt.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📅</div><p>No attendance records</p></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Member</th><th>Date</th><th>Time</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {allAtt.slice(0, 100).map(a => {
                      const date = a.date?.toDate ? a.date.toDate() : new Date();
                      return (
                        <tr key={a.id}>
                          <td style={{ fontWeight: 500 }}>{a.memberName}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{format(date, 'dd MMM yyyy')}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{format(date, 'hh:mm a')}</td>
                          <td><span className="badge badge-green">{a.status || 'present'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
