'use client';

import { useState, useEffect, useRef, use } from 'react';
import styles from './page.module.css';

export default function DisplayPage({ params }) {
  const unwrappedParams = use(params);
  const companyId = unwrappedParams.companyId;

  const [queueData, setQueueData] = useState(null);
  const [currentTime, setCurrentTime] = useState('');
  const prevTicketRef = useRef(0);
  const [changed, setChanged] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    // Clock setup
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Polling setup instead of Server-Sent Events to prevent Vercel serverless timeouts
    let isMounted = true;
    
    const fetchQueueData = async () => {
      try {
        const response = await fetch(`/api/queue/${companyId}`);
        if (!response.ok) return;
        const data = await response.json();
        
        if (isMounted) {
          setQueueData(prev => {
            if (prev && data.lastCallTime !== prev.lastCallTime) {
              playAlertSound();
              setChanged(true);
              setTimeout(() => setChanged(false), 1000);
            }
            return data;
          });
        }
      } catch (error) {
        console.error('Error fetching queue data:', error);
      }
    };

    // Fetch immediately
    fetchQueueData();

    // Poll every 2 seconds
    const intervalId = setInterval(fetchQueueData, 2000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [companyId]);

  const playAlertSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio not supported or blocked');
    }
  };

  if (!queueData) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>Loading Queue...</div>;
  }

  const { currentTicket, currentCounter, history, missed, settings } = queueData;
  const { companyName, logoUrl, backgroundColor, textColor, primaryColor, scrollingText } = settings || {};

  const activeCounters = Object.entries(queueData?.activeCounters || {})
    .map(([counter, data]) => ({ counter, ...data }))
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div
      className={styles.displayContainer}
      style={{
        background: `radial-gradient(circle at top center, ${backgroundColor || '#f8fafc'} 0%, color-mix(in srgb, ${backgroundColor || '#f8fafc'} 80%, black) 130%)`,
        color: textColor || '#0f172a',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >

      <div className={styles.splitContainer}>
        <main className={styles.mainContent}>
          <section className={styles.currentTicketSection}>
            <div className={styles.nowServingText} style={{ color: primaryColor || '#3b82f6', letterSpacing: '8px', opacity: 0.8 }}>
              Now Serving
            </div>

            {activeCounters.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', height: '100%', justifyContent: 'space-evenly', alignItems: 'center', overflow: 'hidden' }}>
                {activeCounters.slice(0, 5).map((ac, index) => (
                  <div key={ac.counter} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '2rem', width: '90%', padding: '0.2rem 1rem', flex: 1, minHeight: 0, background: index === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: index === 0 ? '2px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s ease' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                      <div style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Queue No</div>
                      <div className={`${styles.ticketNumber} ${index === 0 && changed ? styles.changed : ''}`} style={{ fontSize: 'clamp(1.5rem, 4vh, 2.5rem)', textShadow: 'none', lineHeight: 1, marginTop: '0.2rem' }}>
                        {ac.ticket}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '1rem', justifyContent: 'center', flex: 1 }}>
                      <div style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Counter</div>
                      <div style={{ fontSize: 'clamp(1.5rem, 4vh, 2.5rem)', fontWeight: '900', lineHeight: '1', color: textColor || '#fff', marginTop: '0.2rem' }}>
                        {ac.counter}
                      </div>
                    </div>
                    
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '2rem', width: '100%' }}>
                <div className={`${styles.ticketNumber}`}>0</div>
              </div>
            )}
          </section>

          {missed?.length > 0 && (
            <aside className={styles.historySection} style={{ flex: 'none', padding: '1rem 2rem', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
              <h2 className={styles.historyTitle} style={{ color: '#fca5a5', borderBottomColor: 'rgba(239, 68, 68, 0.2)' }}>Missed</h2>
              <div className={styles.historyList}>
                {missed.map((item, i) => {
                  const ticketNum = typeof item === 'object' ? item.ticket : item;
                  const counterStr = typeof item === 'object' && item.counter ? ` (C${item.counter})` : '';
                  return (
                    <div key={i} className={styles.historyItem} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'clamp(60px, 8vw, 90px)', padding: 'clamp(0.5rem, 1.5vh, 1rem)', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <span style={{ fontSize: 'clamp(1.5rem, 4vh, 2.5rem)', lineHeight: '1', fontWeight: 800 }}>{ticketNum}</span>
                      {counterStr && <span style={{ fontSize: 'clamp(0.75rem, 2vh, 0.9rem)', opacity: 0.8, marginTop: '0.3rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>{counterStr}</span>}
                    </div>
                  );
                })}
              </div>
            </aside>
          )}
          {scrollingText && (
            <div style={{ marginTop: 'auto', background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ display: 'inline-block', animation: 'scroll-left 20s linear infinite', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {scrollingText}
              </div>
            </div>
          )}
        </main>

        <section className={styles.videoSection}>
          <video
            className={styles.videoPlayer}
            src="https://www.w3schools.com/html/mov_bbb.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
        </section>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scroll-left {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}} />

      {/* Full screen flash overlay */}
      <div className={`${styles.flashOverlay} ${changed ? styles.flashActive : ''}`} />
    </div>
  );
}
