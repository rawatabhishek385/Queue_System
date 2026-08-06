'use client';

import { useState, useEffect, use } from 'react';
import styles from './page.module.css';
import { toast } from 'sonner';

export default function AdminPage({ params }) {
  const unwrappedParams = use(params);
  const companyId = unwrappedParams.companyId;

  const [queueData, setQueueData] = useState(null);
  const [settingsForm, setSettingsForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [overrideNumber, setOverrideNumber] = useState('');
  const [changed, setChanged] = useState(false);
  const [counterNumber, setCounterNumber] = useState('');
  useEffect(() => {
    // Load saved counter number on mount
    const savedCounter = localStorage.getItem('queue_counter_number');
    if (savedCounter) setCounterNumber(savedCounter);
  }, []);

  useEffect(() => {
    // True Server-Sent Events (SSE) for 0-latency updates
    let isMounted = true;
    
    const eventSource = new EventSource(`/api/queue/${companyId}/live`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (isMounted) {
          setQueueData(data);
          
          // Only set settings form if we just loaded, otherwise it overrides user typing
          setSettingsForm(prev => {
            if (Object.keys(prev).length === 0) {
              return data.settings || {};
            }
            return prev;
          });
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    return () => {
      isMounted = false;
      eventSource.close();
    };
  }, [companyId]);

  const handleAction = async (action, payload = null) => {
    try {
      let customPayload = payload || {};
      
      const fullPayload = { ...customPayload, counterNumber };
      const res = await fetch(`/api/queue/${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload: fullPayload })
      });
      const data = await res.json();
      setQueueData(data);
      
      if (['call_next', 'recall', 'override'].includes(action)) {
        setChanged(true);
        setTimeout(() => setChanged(false), 800);
      }
      
      if (action === 'update_settings') {
        toast.success('Settings saved successfully!');
      } else if (['call_next', 'recall', 'override', 'mark_missed', 'reset'].includes(action)) {
        toast.success('Queue updated successfully!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Action failed!');
    }
  };

  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setSettingsForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCounterChange = (e) => {
    const val = e.target.value;
    setCounterNumber(val);
    localStorage.setItem('queue_counter_number', val);
  };
  
  const totalCounters = parseInt(settingsForm?.totalCounters || queueData?.settings?.totalCounters || 5, 10);
  const counterOptions = Array.from({ length: totalCounters }, (_, i) => i + 1);

  if (loading) return <div className={styles.container} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 600}}>Loading control panel...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 style={{ color: '#000000' }}>Queue Control Panel</h1>
        <p style={{ color: '#000000' }}>Manage the queue and customize the display for <strong>{companyId}</strong></p>
      </div>

      <div className={styles.grid}>
        {/* Queue Management Card */}
        <div className={`glass ${styles.card}`}>
          <h2 className={styles.cardTitle}>Live Queue</h2>
          
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <label style={{ color: '#000000', fontWeight: 'bold' }}>Total Counters:</label>
            <input 
              className="input-field" 
              type="number"
              min="1"
              max="50"
              name="totalCounters"
              value={settingsForm?.totalCounters || queueData?.settings?.totalCounters || 5} 
              onChange={handleSettingChange}
              style={{ width: '80px', textAlign: 'center', padding: '0.5rem' }}
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <label style={{ color: '#000000', fontWeight: 'bold' }}>My Counter:</label>
            <select
              className="input-field" 
              style={{ width: '100px', textAlign: 'center', padding: '0.5rem' }}
              value={counterNumber}
              onChange={handleCounterChange}
            >
              <option value="" disabled>Select</option>
              {counterOptions.map(num => (
                <option key={num} value={num.toString()}>{num}</option>
              ))}
            </select>
          </div>

          <div className={`${styles.currentNumber} ${changed ? styles.changed : ''}`}>
            {(counterNumber && queueData?.activeCounters?.[counterNumber]?.ticket) || 0}
          </div>
          {counterNumber && queueData?.activeCounters?.[counterNumber]?.customer && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1rem', background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(0,0,0,0.05)' }}>
              <p style={{ textAlign: 'center', color: '#10b981', fontWeight: 600, fontSize: '1.4rem' }}>
                Ticket {queueData.activeCounters[counterNumber].ticket} is at Counter {counterNumber}!
              </p>
              {queueData.activeCounters[counterNumber].customer.name && (
                <p style={{ textAlign: 'center', color: '#059669', marginTop: '0.5rem', fontWeight: 'bold' }}>
                  {queueData.activeCounters[counterNumber].customer.name} {queueData.activeCounters[counterNumber].customer.phone ? `(${queueData.activeCounters[counterNumber].customer.phone})` : ''}
                </p>
              )}
            </div>
          )}
          <p style={{ textAlign: 'center', color: '#000000', fontWeight: 'bold' }}>Current Ticket</p>

          <div className={styles.controls}>
            <button className="btn btn-primary" onClick={() => handleAction('call_next')}>
              Call Next Number
            </button>
            <button className="btn glass" onClick={() => handleAction('recall')} style={{ color: '#000000', fontWeight: 'bold' }}>
              Recall Current
            </button>
            <button className="btn glass" onClick={() => handleAction('mark_missed')} style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.5)' }}>
              Mark as Missed
            </button>
            <button className="btn btn-danger" onClick={() => handleAction('reset')}>
              Reset Queue
            </button>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <input 
              type="number" 
              className="input-field" 
              placeholder="Ticket #" 
              value={overrideNumber}
              onChange={(e) => setOverrideNumber(e.target.value)}
              style={{ width: '120px' }}
            />
            <button 
              className="btn btn-primary" 
              onClick={() => {
                if (overrideNumber) {
                  handleAction('override', { ticketNumber: overrideNumber });
                  setOverrideNumber('');
                }
              }}
            >
              Override Number
            </button>
          </div>

          {queueData?.waitingList?.length > 0 && (
            <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '1rem', background: 'rgba(59, 130, 246, 0.05)' }}>
              <p style={{ fontSize: '1rem', color: '#2563eb', fontWeight: 'bold', marginBottom: '1rem' }}>Waiting List ({queueData.waitingList.length}):</p>
              <div className={styles.historyList} style={{ flexWrap: 'wrap' }}>
                {queueData.waitingList.map((item, i) => (
                  <div key={i} className={styles.historyTag} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                    <span style={{ fontWeight: 'bold' }}>T-{item.ticket}: {item.name}</span>
                    {item.phone && <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{item.phone}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {queueData?.history?.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#000000', fontWeight: 'bold' }}>Recent history:</p>
              <div className={styles.historyList}>
                {queueData.history.map((item, i) => {
                  const ticketNum = typeof item === 'object' ? item.ticket : item;
                  const counterStr = typeof item === 'object' && item.counter ? ` (C${item.counter})` : '';
                  return (
                    <span key={i} className={styles.historyTag}>
                      {ticketNum}{counterStr}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {queueData?.missed?.length > 0 && (
            <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '1rem', background: 'rgba(239, 68, 68, 0.05)' }}>
              <p style={{ fontSize: '1rem', color: '#dc2626', fontWeight: 'bold', marginBottom: '1rem' }}>Missed Tickets:</p>
              <div className={styles.historyList} style={{ flexWrap: 'wrap' }}>
                {queueData.missed.map((item, i) => {
                  const ticketNum = typeof item === 'object' ? item.ticket : item;
                  const counterStr = typeof item === 'object' && item.counter ? ` (C${item.counter})` : '';
                  return (
                    <div key={i} className={styles.historyTag} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                      <span>{ticketNum}{counterStr}</span>
                      <button 
                        onClick={() => handleAction('remove_missed', { ticketNumber: ticketNum })}
                        style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}
                        title="Remove from Missed"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Settings Card */}
        <div className={`glass ${styles.card}`}>
          <h2 className={styles.cardTitle}>Display Settings</h2>
          
          <div className={styles.formGrid}>

            <div className="input-group">
              <label>Company Name</label>
              <input 
                className="input-field" 
                name="companyName"
                value={settingsForm.companyName || ''} 
                onChange={handleSettingChange}
              />
            </div>
            
            <div className="input-group">
              <label>Logo URL (optional)</label>
              <input 
                className="input-field" 
                name="logoUrl"
                value={settingsForm.logoUrl || ''} 
                onChange={handleSettingChange}
                placeholder="https://..."
              />
            </div>

            <div className="input-group">
              <label>Primary Color</label>
              <input 
                type="color"
                className="input-field" 
                name="primaryColor"
                style={{height: '50px', padding: '0.25rem'}}
                value={settingsForm.primaryColor || '#0066cc'} 
                onChange={handleSettingChange}
              />
            </div>

            <div className="input-group">
              <label>Background Color</label>
              <input 
                type="color"
                className="input-field" 
                name="backgroundColor"
                style={{height: '50px', padding: '0.25rem'}}
                value={settingsForm.backgroundColor || '#0a0a0a'} 
                onChange={handleSettingChange}
              />
            </div>
            
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>Text Color</label>
              <input 
                type="color"
                className="input-field" 
                name="textColor"
                style={{height: '50px', padding: '0.25rem'}}
                value={settingsForm.textColor || '#ffffff'} 
                onChange={handleSettingChange}
              />
            </div>
            
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>Scrolling Ticker Text (Bottom)</label>
              <input 
                className="input-field" 
                name="scrollingText"
                value={settingsForm.scrollingText || ''} 
                onChange={handleSettingChange}
                placeholder="Welcome to our queue! Please wait..."
              />
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ marginTop: 'auto' }}
            onClick={() => handleAction('update_settings', settingsForm)}
          >
            Save Display Settings
          </button>
        </div>
      </div>
    </div>
  );
}
