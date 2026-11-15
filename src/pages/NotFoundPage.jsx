import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/navigation/Navbar';
import { Home, ArrowRight, Compass } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 60px' }}>
        <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '40px', textAlign: 'center', background: '#ffffff' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--tw-brand-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--tw-brand)'
            }}
          >
            <Compass size={32} />
          </div>

          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase' }}>
            404 • Trace Not Found
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--tw-text)', marginTop: '6px', marginBottom: '12px' }}>
            Unrouted Pin Endpoint
          </h1>
          <p style={{ fontSize: '0.94rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, marginBottom: '28px' }}>
            The destination you are looking for does not exist on this board. Return home or launch the studio to begin a new circuit.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/" className="btn-secondary" style={{ padding: '10px 20px' }}>
              <Home size={15} />
              <span>Back Home</span>
            </Link>
            <Link to="/app" className="btn-primary" style={{ padding: '10px 22px' }}>
              <span>Open Studio</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
