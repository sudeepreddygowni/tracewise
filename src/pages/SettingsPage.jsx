import React from 'react';
import { useProject } from '../store/useProjectStore';
import { exportProjectsJson } from '../services/projectStorage';
import { Moon, Sun, Download, Trash2, Shield, Eye, RotateCcw } from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleArea
} from '../components/ui/BubbleActions';

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
    <TracewiseBubbleArea theme="light">
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', display: 'flex', flexDirection: 'column' }}>
        <main style={{ maxWidth: '780px', margin: '0 auto', width: '100%', padding: '120px 24px 60px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Preferences
            </span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--tw-text)', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
              Settings & Storage
            </h1>
            <p style={{ fontSize: '0.94rem', color: 'var(--tw-text-secondary)', marginTop: '4px' }}>
              Manage theme display, animation accessibility, and browser-stored project data.
            </p>
          </div>

          {/* Theme Preference */}
          <section className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tw-text)', fontFamily: 'var(--font-heading)' }}>
              Interface Appearance
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--tw-text-secondary)' }}>
              Switch between Light mode (uses Light glass material preset) and Dark mode (uses Rainbow glass preset).
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <TracewiseBubbleButton
                onClick={() => setPreferences({ theme: 'light' })}
                variant={(preferences.theme || 'light') === 'light' ? 'primary' : 'secondary'}
                size="md"
                style={{
                  flex: 1,
                  padding: '14px',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Sun size={18} />
                <span>Light Theme</span>
              </TracewiseBubbleButton>

              <TracewiseBubbleButton
                onClick={() => setPreferences({ theme: 'dark' })}
                variant={preferences.theme === 'dark' ? 'primary' : 'secondary'}
                size="md"
                style={{
                  flex: 1,
                  padding: '14px',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Moon size={18} />
                <span>Dark Theme</span>
              </TracewiseBubbleButton>
            </div>
          </section>

          {/* Motion Preference */}
          <section className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tw-text)', fontFamily: 'var(--font-heading)' }}>
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
              <TracewiseBubbleButton
                onClick={() => setPreferences({ reducedMotion: !preferences.reducedMotion })}
                variant={preferences.reducedMotion ? 'primary' : 'secondary'}
                size="sm"
                style={{ padding: '6px 16px' }}
              >
                {preferences.reducedMotion ? 'Enabled' : 'Disabled'}
              </TracewiseBubbleButton>
            </div>
          </section>

          {/* Storage Management */}
          <section className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tw-text)', fontFamily: 'var(--font-heading)' }}>
              Browser Storage Manager
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--tw-text-secondary)' }}>
              All projects and snapshots are stored locally in your browser's persistent storage. Currently storing <b>{projects.length} project records</b>.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <TracewiseBubbleButton
                onClick={handleExport}
                variant="secondary"
                size="md"
                style={{ padding: '10px 18px', fontSize: '0.86rem', gap: '8px' }}
              >
                <Download size={15} />
                <span>Export All Projects (JSON)</span>
              </TracewiseBubbleButton>

              <TracewiseBubbleButton
                onClick={handleClearData}
                variant="danger"
                size="md"
                style={{ padding: '10px 18px', fontSize: '0.86rem', gap: '8px' }}
              >
                <Trash2 size={15} />
                <span>Reset Local Data</span>
              </TracewiseBubbleButton>
            </div>
          </section>
        </main>
      </div>
    </TracewiseBubbleArea>
  );
}
