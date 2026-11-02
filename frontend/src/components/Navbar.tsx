import React from 'react';
import { Layers, UserCheck } from 'lucide-react';

interface Props {
  onRequestDemo: () => void;
  onOpenSignIn: () => void;
  currentUser: string | null;
  onSignOut: () => void;
}

export const Navbar: React.FC<Props> = ({
  onRequestDemo,
  onOpenSignIn,
  currentUser,
  onSignOut,
}) => {
  return (
    <header className="header">
      <a
        href="#"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            background: 'var(--primary)',
            color: '#ffffff',
            padding: '0.45rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Layers size={18} />
        </div>
        <span
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            color: 'var(--text-main)',
            whiteSpace: 'nowrap',
          }}
        >
          Claims Reconciliation System
        </span>
      </a>

      <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a
            href="#how-it-works"
            className="tab-btn"
            style={{ fontSize: '0.875rem', padding: '0.5rem 0.85rem', textDecoration: 'none', color: '#475569' }}
          >
            How It Works
          </a>
          <a
            href="#features"
            className="tab-btn"
            style={{ fontSize: '0.875rem', padding: '0.5rem 0.85rem', textDecoration: 'none', color: '#475569' }}
          >
            Features
          </a>
          <a
            href="#faq"
            className="tab-btn"
            style={{ fontSize: '0.875rem', padding: '0.5rem 0.85rem', textDecoration: 'none', color: '#475569' }}
          >
            FAQ
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                  color: '#334155',
                  background: '#f1f5f9',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  whiteSpace: 'nowrap',
                }}
              >
                <UserCheck size={14} style={{ color: 'var(--success)' }} />
                <span>{currentUser.split('@')[0]}</span>
              </div>
              <button
                className="btn"
                onClick={onSignOut}
                style={{ padding: '0.55rem 0.9rem', fontSize: '0.8rem' }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={onOpenSignIn} style={{ padding: '0.55rem 0.9rem', fontSize: '0.8rem' }}>
                Sign In
              </button>
              <button className="btn btn-primary" onClick={onRequestDemo} style={{ padding: '0.55rem 0.9rem', fontSize: '0.8rem' }}>
                Book Demo
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
