'use client';
import Link from 'next/link';
import { use } from 'react';

export default function PortalPage({ params }) {
  const unwrappedParams = use(params);
  const companyId = unwrappedParams.companyId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '2rem', padding: '2rem', background: '#f8fafc', color: '#0f172a' }}>
      
      <h1 style={{ fontSize: '3rem', fontWeight: 800, textAlign: 'center', background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Workspace: {companyId}
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#475569', textAlign: 'center', maxWidth: '600px' }}>
        Welcome to your company hub. Choose which app you want to launch for this workspace.
      </p>

      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link 
          href={`/admin/${companyId}`} 
          style={{ padding: '1.5rem 2rem', background: '#ffffff', border: '2px solid #3b82f6', borderRadius: '1rem', color: '#1e293b', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '250px', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.2)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; }}
        >
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>Admin Panel</span>
          <span style={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center' }}>Manage settings, call tickets, and view history.</span>
        </Link>
        
        <Link 
          href={`/display/${companyId}`} 
          style={{ padding: '1.5rem 2rem', background: '#ffffff', border: '2px solid #8b5cf6', borderRadius: '1rem', color: '#1e293b', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '250px', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(139, 92, 246, 0.2)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; }}
        >
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>TV Display</span>
          <span style={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center' }}>Connect this to your waiting room TV or screen.</span>
        </Link>
        
        <Link 
          href={`/kiosk/${companyId}`} 
          style={{ padding: '1.5rem 2rem', background: '#ffffff', border: '2px solid #10b981', borderRadius: '1rem', color: '#1e293b', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '250px', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(16, 185, 129, 0.2)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; }}
        >
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>Kiosk Generator</span>
          <span style={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center' }}>Put this on an iPad for customers to join the queue.</span>
        </Link>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <Link href="/" style={{ color: '#64748b', textDecoration: 'underline' }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
