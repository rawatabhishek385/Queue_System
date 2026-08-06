'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import styles from './page.module.css';

export default function KioskPage() {
  const { companyId } = useParams();
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [peopleAhead, setPeopleAhead] = useState(0);

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 5000);
    return () => clearInterval(interval);
  }, [companyId]);

  const fetchQueueData = async () => {
    try {
      const res = await fetch(`/api/queue/${companyId}`);
      const data = await res.json();
      setQueueData(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    
    try {
      const res = await fetch(`/api/queue/${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_token', payload: { name, phone, email } })
      });
      const data = await res.json();
      
      // Find the last generated ticket in the new waiting list
      if (data.waitingList && data.waitingList.length > 0) {
        const myTicket = data.waitingList[data.waitingList.length - 1];
        setGeneratedTicket(myTicket);
        // The number of people ahead is the length of the waiting list minus this new person
        setPeopleAhead(data.waitingList.length - 1);
      } else {
        // Fallback
        setGeneratedTicket({ ticket: data.lastGeneratedTicket, name });
        setPeopleAhead(0);
      }
      
      // Reset form
      setName('');
      setPhone('');
      setEmail('');
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{height: '100vh', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 600}}>
        <Loader2 className="animate-spin" size={48} color="#3b82f6" />
        Loading Kiosk...
      </div>
    );
  }

  const { settings } = queueData || {};
  const { companyName, logoUrl, backgroundColor, textColor, primaryColor } = settings || {};

  return (
    <div 
      className={styles.kioskContainer}
      style={{ 
        background: `radial-gradient(circle at top, ${backgroundColor || '#f8fafc'} 0%, color-mix(in srgb, ${backgroundColor || '#f8fafc'} 85%, black) 120%)`, 
        color: textColor || '#0f172a',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >

      <main className={styles.mainContent}>
        {generatedTicket ? (
          <div className={styles.successCard}>
            <h2 className={styles.successTitle}>Your Ticket Number</h2>
            <div className={styles.bigTicket}>{generatedTicket.ticket}</div>
            
            <p className={styles.successMessage} style={{ fontSize: '1.2rem', margin: '1rem 0 0.5rem 0' }}>
              Hi {generatedTicket.name}, please take a seat. We will call you shortly.
            </p>
            <p className={styles.successMessage} style={{ fontSize: '1.2rem', margin: '0 0 2rem 0', fontWeight: '500' }}>
              There {peopleAhead === 1 ? 'is' : 'are'} currently <strong style={{ color: primaryColor || '#3b82f6', fontSize: '1.5rem' }}>{peopleAhead}</strong> {peopleAhead === 1 ? 'person' : 'people'} ahead of you.
            </p>
            <div className={styles.noPrint} style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' }}>
              <button 
                className={styles.btn} 
                style={{ background: 'transparent', border: `2px solid ${primaryColor || '#3b82f6'}`, color: primaryColor || '#3b82f6', flex: 1 }}
                onClick={() => window.print()}
              >
                Print Ticket
              </button>
              <button 
                className={styles.btn} 
                style={{ background: primaryColor || '#3b82f6', flex: 1 }}
                onClick={() => {
                  setGeneratedTicket(null);
                  setPeopleAhead(0);
                }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form className={styles.formCard} onSubmit={handleSubmit}>
            <h2 className={styles.formTitle}>Join the Queue</h2>
            <p className={styles.formSubtitle}>Please enter your details to get a ticket.</p>
            
            <div className={styles.inputGroup}>
              <label>Name (Required)</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className={styles.input}
                placeholder="John Doe"
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Phone Number (Optional)</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className={styles.input}
                placeholder="+1 234 567 8900"
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Email (Optional)</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className={styles.input}
                placeholder="john@example.com"
              />
            </div>
            
            <button 
              type="submit" 
              className={styles.submitBtn} 
              style={{ background: primaryColor || '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={submitting || !name.trim()}
            >
              {submitting ? <><Loader2 className="animate-spin" size={20} /> Generating...</> : 'Get My Ticket'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
