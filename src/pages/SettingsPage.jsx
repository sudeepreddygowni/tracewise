import React from 'react';
import { Navbar } from '../components/navigation/Navbar';
import { useProject } from '../store/useProjectStore';
import { exportProjectsJson } from '../services/projectStorage';
import { Moon, Sun, Download, Trash2, Shield, Eye, RotateCcw } from 'lucide-react';

export function SettingsPage() {
  const { preferences, setPreferences, projects } = useProject();

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportProjectsJson());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tracewise_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear local storage? This will reset all projects to default starters.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ maxWidth: '780px', margin: '0 auto', width: '100%', padding: '120px 24px 60px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Preferences
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--tw-text)', marginTop: '4px' }}>
            Settings & Storage
          </h1>
          <p style={{ fontSize: '0.94rem', color: 'var(--tw-text-secondary)', marginTop: '4px' }}>
            Manage theme display, animation accessibility, and browser-stored project data.
          </p>
        </div>

        {/* Theme Preference */}
        <section className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tw-text)' }}>
            Interface Appearance
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--tw-text-secondary)' }}>
            Switch between Light mode (uses Light glass material preset) and Dark mode (uses Rainbow glass preset).
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setPreferences({ theme: 'light' })}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: (preferences.theme || 'light') === 'light' ? '2px solid var(--tw-brand)' : '1px solid var(--tw-border)',
                background: (preferences.theme || 'light') === 'light' ? 'var(--tw-brand-soft)' : 'var(--tw-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 600,
                color: 'var(--tw-text)'
              }}
            >
              <Sun size={18} color="var(--tw-brand)" />
              <span>Light Theme</span>
            </button>

            <button
              onClick={() => setPreferences({ theme: 'dark' })}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: preferences.theme === 'dark' ? '2px solid var(--tw-brand)' : '1px solid var(--tw-border)',
                background: preferences.theme === 'dark' ? '#0b2348' : 'var(--tw-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 600,
                color: preferences.theme === 'dark' ? '#ffffff' : 'var(--tw-text)'
              }}
            >
              <Moon size={18} color="var(--tw-sky)" />
              <span>Dark Theme</span>
            </button>
          </div>
        </section>

        {/* Motion Preference */}
        <section className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tw-text)' }}>
            Motion & Accessibility
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--tw-text)' }}>
                Reduced Motion Mode
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--tw-text-muted)' }}>
                Disables animated circuit reveals, GSAP scroll transitions, and card springs.
              </p>
            </div>
            <button
              onClick={() => setPreferences({ reducedMotion: !preferences.reducedMotion })}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--tw-radius-pill)',
                fontWeight: 600,
                fontSize: '0.82rem',
                backgroundColor: preferences.reducedMotion ? 'var(--tw-brand)' : 'var(--tw-bg)',
                color: preferences.reducedMotion ? '#ffffff' : 'var(--tw-text)',
                border: '1px solid var(--tw-border)'
              }}
            >
              {preferences.reducedMotion ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </section>

        {/* Storage Management */}
        <section className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tw-text)' }}>
            Browser Storage Manager
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--tw-text-secondary)' }}>
            All projects and snapshots are stored locally in your browser's persistent storage. Currently storing <b>{projects.length} project records</b>.
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleExport}
              className="btn-secondary"
              style={{ padding: '10px 18px', fontSize: '0.86rem' }}
            >
              <Download size={15} />
              <span>Export All Projects (JSON)</span>
            </button>

            <button
              onClick={handleClearData}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--tw-radius-pill)',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                fontWeight: 600,
                fontSize: '0.86rem'
              }}
            >
              <Trash2 size={15} />
              <span>Reset Local Data</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
