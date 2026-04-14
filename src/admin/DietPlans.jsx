// src/admin/DietPlans.jsx
import React, { useEffect, useState } from 'react';
import { getDietPlans, addDietPlan, updateDietPlan, deleteDietPlan } from '../services/dietService';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch } from 'react-icons/fi';

const BLANK_MEAL = { time: 'Breakfast', food: '' };
const BLANK = { title: '', description: '', goal: 'General', meals: [{ ...BLANK_MEAL }] };
const MEALS_TIMES = ['Early Morning', 'Breakfast', 'Mid-Morning', 'Lunch', 'Evening Snack', 'Dinner', 'Post-Workout', 'Pre-Workout'];
const GOALS = ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Bulking', 'General'];
const goalColor = { 'Weight Loss': 'badge-red', 'Muscle Gain': 'badge-blue', 'Bulking': 'badge-orange', 'General': 'badge-accent', 'Maintenance': 'badge-green' };

export default function DietPlans() {
  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const load = async () => { const p = await getDietPlans(); setPlans(p); setLoading(false); };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ ...BLANK, meals: [{ time: 'Breakfast', food: '' }] }); setEditing(null); setModal(true); };
  const openEdit = (p) => { setForm({ ...p, meals: p.meals || [] }); setEditing(p.id); setModal(true); };

  const addMeal = () => setForm(f => ({ ...f, meals: [...f.meals, { time: 'Breakfast', food: '' }] }));
  const removeMeal = (i) => setForm(f => ({ ...f, meals: f.meals.filter((_, idx) => idx !== i) }));
  const updateMeal = (i, key, val) => setForm(f => ({
    ...f, meals: f.meals.map((m, idx) => idx === i ? { ...m, [key]: val } : m)
  }));

  const handleSubmit = async () => {
    if (!form.title) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      const data = { ...form, meals: form.meals.filter(m => m.food) };
      if (editing) { await updateDietPlan(editing, data); toast.success('Plan updated'); }
      else { await addDietPlan(data); toast.success('Plan created'); }
      setModal(false); load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    await deleteDietPlan(id); toast.success('Deleted'); load();
  };

  const filtered = plans.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.goal?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Diet Plans</h1>
          <p className="page-subtitle">{plans.length} plans created</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <FiPlus /> {isMobile ? 'Add' : 'Create Plan'}
        </button>
      </div>

      <div style={{ marginBottom: isMobile ? 14 : 20 }}>
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input placeholder="Search plans..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🥗</div><p>No diet plans yet</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: isMobile ? 10 : 16 }}>
          {filtered.map(p => (
            <div key={p.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{p.title}</div>
                  <span className={`badge ${goalColor[p.goal] || 'badge-accent'}`}>{p.goal}</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}><FiEdit2 /></button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id, p.title)}><FiTrash2 /></button>
                </div>
              </div>
              {p.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 10 }}>{p.description}</p>}
              {p.meals?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {p.meals.slice(0, 3).map((m, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--accent)', minWidth: 110, flexShrink: 0 }}>{m.time}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{m.food}</span>
                    </div>
                  ))}
                  {p.meals.length > 3 && (
                    <button style={{ fontSize: '0.78rem', color: 'var(--accent)', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2, padding: 0 }}
                      onClick={() => setViewModal(p)}>
                      +{p.meals.length - 3} more meals →
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* View all meals */}
      {viewModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewModal(null)}>
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>{viewModal.title}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewModal(null)}><FiX /></button>
            </div>
            <span className={`badge ${goalColor[viewModal.goal] || 'badge-accent'}`} style={{ marginBottom: 14, display: 'inline-flex' }}>{viewModal.goal}</span>
            {viewModal.description && <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 14 }}>{viewModal.description}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {viewModal.meals?.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 8 }}>
                  <span style={{ color: 'var(--accent)', minWidth: 110, flexShrink: 0, fontSize: '0.85rem', fontWeight: 500 }}>{m.time}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{m.food}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box" style={!isMobile ? { maxWidth: 620 } : {}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>{editing ? 'Edit Plan' : 'Create Plan'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}><FiX /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Plan Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Weight Loss Plan" />
                </div>
                <div className="form-group">
                  <label className="form-label">Goal</label>
                  <select className="form-input" value={form.goal} onChange={e => setForm({...form, goal: e.target.value})}>
                    {GOALS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief description..." />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label className="form-label" style={{ margin: 0 }}>Meals</label>
                  <button className="btn btn-ghost btn-sm" onClick={addMeal}><FiPlus /> Add Meal</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.meals.map((m, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select className="form-input" style={{ flex: '0 0 130px' }} value={m.time} onChange={e => updateMeal(i, 'time', e.target.value)}>
                        {MEALS_TIMES.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <input className="form-input" placeholder="Food items..." value={m.food} onChange={e => updateMeal(i, 'food', e.target.value)} />
                      <button className="btn btn-danger btn-sm" style={{ flexShrink: 0, minWidth: 36, padding: '6px 8px' }} onClick={() => removeMeal(i)}><FiX /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                  {saving ? <span className="spinner" style={{width:16,height:16,borderWidth:2}} /> : null}
                  {saving ? 'Saving...' : (editing ? 'Update' : 'Create')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
