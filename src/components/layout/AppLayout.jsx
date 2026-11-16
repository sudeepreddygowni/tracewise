import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../navigation/Navbar';
import { ScrollManager } from '../navigation/ScrollManager';

export function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--tw-bg)' }}>
      {/* Scroll restoration and hash link manager */}
      <ScrollManager />

      {/* Permanently mounted navigation bar */}
      <Navbar />

      {/* Main page content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
}
