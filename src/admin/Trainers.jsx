// src/admin/Trainers.jsx
import React, { useEffect, useState } from 'react';
import { getTrainers, addTrainer, updateTrainer, deleteTrainer } from '../services/trainerService';
import { getMembers } from '../services/memberService';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiUser } from 'react-icons/fi';
import { getInitials } from '../utils/cloudinaryUpload';

const BLANK = { name: '', phone: '', specialization: '', experience: '', email: '' };
const SPECS = ['Weight Loss', 'Muscle Gain', 'Cardio', 'Yoga', 'CrossFit', 'Nutrition', 'General Fitness'];

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const load = async () => {
    const [t, m] = await Promise.all([getTrainers(), getMembers()]);
    setTrainers(t); setMembers(m); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(BLANK); setEditing(null); setModal(true); };
  const openEdit = (t) => { setForm(t); setEditing(t.id); setModal(true); };

  const handleSubmit = async () => {
    if (!form.name || !form.phone) { toast.error('Name and phone required'); return; }
    setSaving(true);
    try {
      const data = { ...form, experience: Number(form.experience) || 0 };
      if (editing) { await updateTrainer(editing, data); toast.success('Trainer updated'); }
      else { await addTrainer(data); toast.success('Trainer added'); }
      setModal(false); load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete trainer ${name}?`)) return;
    await deleteTrainer(id); toast.success('Deleted'); load();
  };

  const filtered = trainers.filter(t => {
    const q = search.toLowerCase();
    return t.name?.toLowerCase().includes(q) || t.specialization?.toLowerCase().includes(q) || t.phone?.includes(q);
  });

  const getMemberCount = (trainerId) => members.filter(m => m.trainerId === trainerId).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Trainers</h1>
          <p className="page-subtitle">{trainers.length} staff members</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <FiPlus /> {isMobile ? 'Add' : 'Add Trainer'}
        </button>
      </div>

      <div style={{ marginBottom: isMobile ? 14 : 20 }}>
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input placeholder="Search trainers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🏋️</div><p>No trainers found</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: isMobile ? 10 : 16 }}>
          {filtered.map(t => {
            const memberCount = getMemberCount(t.id);
            return (
              <div key={t.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: isMobile ? 44 : 48, height: isMobile ? 44 : 48, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--accent)', flexShrink: 0 }}>
                      {getInitials(t.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t.name}</div>
                      <span className="badge badge-accent" style={{ marginTop: 3 }}>{t.specialization || 'General'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}><FiEdit2 /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id, t.name)}><FiTrash2 /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', gap: 6 }}>📞 <span>{t.phone}</span></div>
                  {t.email && <div style={{ display: 'flex', gap: 6 }}>✉️ <span>{t.email}</span></div>}
                  <div style={{ display: 'flex', gap: 6 }}>🏅 <span>{t.experience} yrs experience</span></div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <FiUser />
                    <span style={{ color: memberCount > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {memberCount} member{memberCount !== 1 ? 's' : ''} assigned
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>{editing ? 'Edit Trainer' : 'Add Trainer'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}><FiX /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Amit Sir" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input className="form-input" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="9876543210" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="trainer@email.com" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Specialization</label>
                  <select className="form-input" value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})}>
                    <option value="">Select...</option>
                    {SPECS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Experience (yrs)</label>
                  <input className="form-input" type="number" value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} placeholder="5" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                  {saving ? <span className="spinner" style={{width:16,height:16,borderWidth:2}} /> : null}
                  {saving ? 'Saving...' : (editing ? 'Update' : 'Add Trainer')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
