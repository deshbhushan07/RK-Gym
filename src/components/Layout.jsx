// src/components/Layout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        marginLeft: isMobile ? 0 : 'var(--sidebar-width)',
        flex: 1,
        padding: isMobile ? '20px 14px 0' : '28px 32px',
        minWidth: 0,
        maxWidth: '100%',
      }}>
        <Outlet />
        {/* spacer so content doesn't hide behind bottom nav */}
        <div className="bottom-nav-spacer" />
      </main>
    </div>
  );
}
