import React from 'react';
import { Navbar } from '../components/navigation/Navbar';
import { Home, ArrowRight, Compass } from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleArea
} from '../components/ui/BubbleActions';

export function NotFoundPage() {
  return (
    <TracewiseBubbleArea theme="light">
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
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--tw-text)', marginTop: '6px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
              Unrouted Pin Endpoint
            </h1>
            <p style={{ fontSize: '0.94rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, marginBottom: '28px' }}>
              The destination you are looking for does not exist on this board. Return home or launch the studio to begin a new circuit.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <TracewiseBubbleButton
                to="/"
                variant="secondary"
                size="md"
                style={{ padding: '10px 20px', gap: '8px' }}
              >
                <Home size={15} />
                <span>Back Home</span>
              </TracewiseBubbleButton>

              <TracewiseBubbleButton
                to="/app"
                variant="primary"
                size="md"
                style={{ padding: '10px 22px', gap: '8px' }}
              >
                <span>Open Studio</span>
                <ArrowRight size={15} />
              </TracewiseBubbleButton>
            </div>
          </div>
        </main>
      </div>
    </TracewiseBubbleArea>
  );
}
