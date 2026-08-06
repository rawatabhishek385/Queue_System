'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage({ params }) {
  const unwrappedParams = use(params);
  const companyId = unwrappedParams.companyId;
  const router = useRouter();
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Use a hardcoded PIN "1234" for this example
    if (pin === '1234') {
      document.cookie = "admin_auth=authenticated; path=/;";
      router.push(`/admin/${companyId}`);
    } else {
      setError('Invalid PIN');
      setPin('');
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top center, #1e293b 0%, #000000 130%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        padding: '3rem',
        borderRadius: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ color: '#ffffff', marginBottom: '0.5rem', fontSize: '1.8rem', fontWeight: 700 }}>Admin Login</h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Enter the admin PIN for {companyId}</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN (1234)"
            style={{
              padding: '1rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.2)',
              color: '#ffffff',
              fontSize: '1.2rem',
              textAlign: 'center',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
            autoFocus
          />
          {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 500 }}>{error}</div>}
          <button 
            type="submit"
            style={{
              padding: '1rem',
              borderRadius: '0.75rem',
              border: 'none',
              background: '#3b82f6',
              color: '#ffffff',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#2563eb'}
            onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
