'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [companyInput, setCompanyInput] = useState('');

  const handleGo = (e) => {
    e.preventDefault();
    if (!companyInput.trim()) return;
    
    // Convert "Burger King" to "burger-king" for a clean URL
    const formattedId = companyInput.trim().toLowerCase().replace(/\s+/g, '-');
    router.push(`/portal/${formattedId}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '2rem', padding: '2rem', background: '#f8fafc', color: '#0f172a' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, textAlign: 'center', background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Digital Signage Queue System
      </h1>
      <p style={{ fontSize: '1.25rem', opacity: 0.8, textAlign: 'center', maxWidth: '600px', color: '#334155' }}>
        A premium, multi-tenant queue management solution designed for digital signage players.
      </p>

      <form onSubmit={handleGo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem', background: '#ffffff', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '400px' }}>
        <h3 style={{ margin: 0, textAlign: 'center', color: '#1e293b' }}>Create or Access your Queue</h3>
        <input 
          type="text" 
          value={companyInput}
          onChange={(e) => setCompanyInput(e.target.value)}
          placeholder="Enter Company Name (e.g. McDonald's)" 
          style={{ padding: '1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#0f172a', fontSize: '1rem' }}
          required
        />
        <button type="submit" style={{ padding: '1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}>
          Go to Dashboard
        </button>
      </form>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href={`/portal/demo-company`} style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: '500' }}>
          Or try the Demo Company
        </Link>
      </div>

      <div style={{ marginTop: '3rem', padding: '2rem', maxWidth: '800px', background: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ color: '#1e293b' }}>How to use:</h3>
        <ul style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1.5rem', color: '#475569' }}>
          <li>Enter your company name above to instantly create your free isolated dashboard.</li>
          <li>Open the Admin Panel on a tablet or computer to control the queue and change branding colors.</li>
          <li>Set up the Token Generator (Kiosk) on an iPad at the entrance for customers to get tickets.</li>
          <li>Open the TV Display URL in your digital signage software library (like ScreenCloud or Yodeck).</li>
        </ul>
      </div>
    </div>
  );
}
