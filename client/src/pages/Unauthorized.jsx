import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => (
    <div className="max-w-4xl mx-auto px-4 py-24 min-h-screen flex items-center justify-center">
        <div className="glass-panel p-10 rounded-3xl border border-surface-glass-border text-center max-w-xl">
            <div
                style={{
                    width: 64,
                    height: 64,
                    margin: '0 auto 20px',
                    borderRadius: '999px',
                    background: 'rgba(255,107,53,0.15)',
                    border: '1px solid rgba(255,107,53,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FF6B35',
                    fontSize: 30,
                }}
            >
                !
            </div>
            <h1 className="text-3xl font-display text-white mb-3">Unauthorized</h1>
            <p className="text-text-muted mb-6">
                You do not have permission to view this page.
            </p>
            <Link
                to="/login"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 22px',
                    borderRadius: '999px',
                    background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: 700,
                }}
            >
                Return to Login
            </Link>
        </div>
    </div>
);

export default Unauthorized;
