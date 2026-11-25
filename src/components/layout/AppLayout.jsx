import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from '../navigation/Navbar';
import { ScrollManager } from '../navigation/ScrollManager';
import { WelcomeExperience } from '../onboarding/WelcomeExperience';
import { TracewiseMini } from '../help/TracewiseMini';

export function AppLayout() {
  const navigate = useNavigate();

  const handleOpenTour = () => {
    navigate('/learn?tab=tutorials');
  };

  const handleOpenMini = () => {
    window.dispatchEvent(new CustomEvent('tracewise:open_mini'));
  };

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

      {/* Onboarding Welcome Experience (First-time visitors) */}
      <WelcomeExperience
        onOpenTour={handleOpenTour}
        onOpenMini={handleOpenMini}
      />

      {/* Contextual Tracewise Mini AI Assistant */}
      <TracewiseMini />
    </div>
  );
}
