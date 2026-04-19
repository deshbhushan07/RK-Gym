// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';
import {
  FiGrid, FiUsers, FiUserCheck, FiCreditCard,
  FiClipboard, FiCalendar, FiLogOut, FiZap,
  FiMenu, FiX, FiSun, FiMoon
} from 'react-icons/fi';

const nav = [
  { to: '/dashboard',  icon: <FiGrid />,       label: 'Dashboard'  },
  { to: '/members',    icon: <FiUsers />,      label: 'Members'    },
  { to: '/trainers',   icon: <FiUserCheck />,  label: 'Trainers'   },
  { to: '/payments',   icon: <FiCreditCard />, label: 'Payments'   },
  { to: '/diet-plans', icon: <FiClipboard />,  label: 'Diets'      },
  { to: '/attendance', icon: <FiCalendar />,   label: 'Attendance' },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Logged out');
  };

  const ThemeBtn = ({ big }) => (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={big ? { width: 44, height: 44, borderRadius: 10 } : {}}
    >
      {theme === 'dark' ? <FiSun /> : <FiMoon />}
    </button>
  );

  // ── DESKTOP SIDEBAR ──────────────────────────────────────
  if (!isMobile) {
    return (
      <aside style={ds.aside}>
        <div style={ds.brand}>
          <div style={ds.logo}><FiZap /></div>
          <div>
            <div style={ds.logoName}>RK FITNESS</div>
            <div style={ds.logoSub}>Vasagade, Kolhapur</div>
          </div>
          <ThemeBtn />
        </div>

        <nav style={ds.nav}>
          {nav.map(item => (
            <NavLink
              key={item.to} to={item.to}
              style={({ isActive }) => ({ ...ds.navItem, ...(isActive ? ds.navActive : {}) })}
            >
              <span style={ds.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={ds.bottom}>
          <div style={ds.userRow}>
            <div style={ds.userAvatar}>{user?.email?.[0]?.toUpperCase() || 'A'}</div>
            <div style={ds.userInfo}>
              <div style={ds.userName}>Admin</div>
              <div style={ds.userEmail} title={user?.email}>{user?.email}</div>
            </div>
          </div>
          <button style={ds.logoutBtn} onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>
    );
  }

  // ── MOBILE: BOTTOM TAB BAR + DRAWER ─────────────────────
  const bottomNav = nav.slice(0, 5);

  return (
    <>
      {drawerOpen && (
        <div style={ms.overlay} onClick={() => setDrawerOpen(false)}>
          <div style={ms.drawer} onClick={e => e.stopPropagation()}>
            <div style={ms.drawerHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={ms.logo}><FiZap /></div>
                <div>
                  <div style={ms.logoName}>RK FITNESS</div>
                  <div style={ms.logoSub}>Vasagade, Kolhapur</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <ThemeBtn big />
                <button style={ms.closeBtn} onClick={() => setDrawerOpen(false)}><FiX /></button>
              </div>
            </div>

            <nav style={ms.drawerNav}>
              {nav.map(item => (
                <NavLink
                  key={item.to} to={item.to}
                  onClick={() => setDrawerOpen(false)}
                  style={({ isActive }) => ({ ...ms.drawerItem, ...(isActive ? ms.drawerActive : {}) })}
                >
                  <span style={ms.drawerIcon}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div style={ms.drawerBottom}>
              <div style={ms.drawerUser}>
                <div style={ms.drawerAvatar}>{user?.email?.[0]?.toUpperCase() || 'A'}</div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Admin</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                </div>
              </div>
              <button style={ms.logoutBtn} onClick={handleLogout}>
                <FiLogOut /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav style={ms.bottomNav}>
        {bottomNav.map(item => (
          <NavLink
            key={item.to} to={item.to}
            style={({ isActive }) => ({ ...ms.tab, ...(isActive ? ms.tabActive : {}) })}
          >
            <span style={ms.tabIcon}>{item.icon}</span>
            <span style={ms.tabLabel}>{item.label}</span>
          </NavLink>
        ))}
        <button style={ms.tab} onClick={() => setDrawerOpen(true)}>
          <span style={ms.tabIcon}><FiMenu /></span>
          <span style={ms.tabLabel}>More</span>
        </button>
      </nav>
    </>
  );
}

// ── Desktop styles ──────────────────────────────────────────
const ds = {
  aside: {
    width: 'var(--sidebar-width)', background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, padding: '20px 0',
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '0 14px 20px', borderBottom: '1px solid var(--border)', marginBottom: 12,
  },
  logo: {
    width: 32, height: 32, borderRadius: 8, background: 'var(--accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#0a0a0a', fontSize: '1rem', flexShrink: 0,
  },
  logoName: { fontFamily: 'var(--font-display)', fontSize: '0.95rem', letterSpacing: '0.08em', flex: 1 },
  logoSub:  { fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 1 },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', borderRadius: 8, fontSize: '0.88rem', fontWeight: 500,
    color: 'var(--text-secondary)', transition: 'var(--transition)',
  },
  navActive: { background: 'var(--accent-dim)', color: 'var(--accent)', borderLeft: '2px solid var(--accent)' },
  navIcon:   { display: 'flex', fontSize: '1rem', flexShrink: 0 },
  bottom: {
    padding: '16px 12px 0', borderTop: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  userRow:   { display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px' },
  userAvatar:{
    width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-dim)',
    color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-display)', fontSize: '0.9rem', flexShrink: 0,
  },
  userInfo:  { minWidth: 0 },
  userName:  { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' },
  userEmail: { fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', borderRadius: 8, width: '100%',
    fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', transition: 'var(--transition)',
  },
};

// ── Mobile styles ───────────────────────────────────────────
const ms = {
  bottomNav: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    height: 'var(--bottom-nav-height)', background: 'var(--bg-secondary)',
    borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'stretch',
    zIndex: 200, paddingBottom: 'env(safe-area-inset-bottom)',
  },
  tab: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 3, padding: '6px 4px', color: 'var(--text-muted)',
    fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.02em',
    transition: 'var(--transition)', background: 'none', border: 'none', cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  tabActive: { color: 'var(--accent)' },
  tabIcon:   { fontSize: '1.2rem', display: 'flex', lineHeight: 1 },
  tabLabel:  { fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' },
  overlay: {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', justifyContent: 'flex-end',
  },
  drawer: {
    width: 280, height: '100%', background: 'var(--bg-secondary)',
    borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
    paddingBottom: 'env(safe-area-inset-bottom)', overflowY: 'auto',
  },
  drawerHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px', borderBottom: '1px solid var(--border)',
  },
  logo:    { width: 30, height: 30, borderRadius: 7, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0a', fontSize: '0.9rem', flexShrink: 0 },
  logoName:{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: '0.08em' },
  logoSub: { fontSize: '0.62rem', color: 'var(--text-muted)' },
  closeBtn:{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-hover)', color: 'var(--text-secondary)', fontSize: '1.1rem' },
  drawerNav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 8px' },
  drawerItem:{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px', borderRadius: 10, fontSize: '0.95rem', fontWeight: 500,
    color: 'var(--text-secondary)', transition: 'var(--transition)', minHeight: 48,
  },
  drawerActive:{ background: 'var(--accent-dim)', color: 'var(--accent)' },
  drawerIcon:  { display: 'flex', fontSize: '1.1rem', flexShrink: 0 },
  drawerBottom:{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 },
  drawerUser:  { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg-hover)', borderRadius: 10 },
  drawerAvatar:{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1rem', flexShrink: 0 },
  logoutBtn:   { display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 10, width: '100%', fontSize: '0.9rem', fontWeight: 500, color: 'var(--red)', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.15)', minHeight: 44 },
};