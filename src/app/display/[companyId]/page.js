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
    // True Server-Sent Events (SSE) for 0-latency updates
    let isMounted = true;
    
    const eventSource = new EventSource(`/api/queue/${companyId}/live`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
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
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    return () => {
      isMounted = false;
      eventSource.close();
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

  const activeList = Object.entries(queueData?.activeCounters || {})
    .map(([counter, data]) => ({ counter, ...data }))
    .sort((a, b) => b.timestamp - a.timestamp);

  const total = settings?.totalCounters || 5;
  const activeCounterIds = new Set(activeList.map(c => c.counter.toString()));
  
  const paddedCounters = [...activeList];
  for (let i = 1; i <= total; i++) {
    const cId = i.toString();
    if (!activeCounterIds.has(cId)) {
      paddedCounters.push({
        counter: cId,
        ticket: '--',
        timestamp: 0
      });
    }
  }

  const activeCounters = paddedCounters.slice(0, 5);

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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', flex: 1, justifyContent: activeCounters.length < 5 ? 'center' : 'space-evenly', alignItems: 'center', overflow: 'hidden' }}>
                {activeCounters.slice(0, 5).map((ac, index) => (
                  <div key={ac.counter} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0.4rem 1.5rem', background: index === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)', borderRadius: '1rem', border: index === 0 ? '2px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.08)', boxShadow: index === 0 ? '0 10px 25px rgba(0,0,0,0.2)' : 'none', transition: 'all 0.3s ease', flexShrink: 1, minHeight: 'min-content' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                      {index === 0 && <div style={{ fontSize: 'clamp(0.6rem, 1.2vh, 0.8rem)', color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 700, marginBottom: '0.2rem' }}>Queue No</div>}
                      <div className={`${styles.ticketNumber} ${index === 0 && changed ? styles.changed : ''}`} style={{ fontSize: 'clamp(1.5rem, 4vh, 3.5rem)', textShadow: index === 0 ? '0 4px 15px rgba(0,0,0,0.3)' : 'none', lineHeight: 1 }}>
                        {ac.ticket}
                      </div>
                    </div>

                    <div style={{ height: '2rem', width: '2px', background: 'rgba(255,255,255,0.15)', margin: '0 1rem' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                      {index === 0 && <div style={{ fontSize: 'clamp(0.6rem, 1.2vh, 0.8rem)', color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 700, marginBottom: '0.2rem' }}>Counter</div>}
                      <div style={{ fontSize: 'clamp(1.5rem, 4vh, 3.5rem)', fontWeight: '900', lineHeight: 1, color: textColor || '#fff', textShadow: index === 0 ? '0 4px 15px rgba(0,0,0,0.3)' : 'none' }}>
                        {ac.counter}
                      </div>
                    </div>
                    
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', flex: 1 }}>
                <div className={`${styles.ticketNumber}`}>0</div>
              </div>
            )}
          </section>

          {missed?.length > 0 && (
            <aside className={styles.historySection} style={{ flex: 'none', padding: '0.5rem 1.5rem', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
              <h2 className={styles.historyTitle} style={{ color: '#fca5a5', borderBottomColor: 'rgba(239, 68, 68, 0.2)', fontSize: 'clamp(1rem, 2vh, 1.2rem)', margin: '0 0 0.5rem 0', padding: '0 0 0.2rem 0' }}>Missed</h2>
              <div className={styles.historyList} style={{ gap: '0.5rem', paddingBottom: '0.2rem' }}>
                {missed.map((item, i) => {
                  const ticketNum = typeof item === 'object' ? item.ticket : item;
                  const counterStr = typeof item === 'object' && item.counter ? ` (C${item.counter})` : '';
                  return (
                    <div key={i} className={styles.historyItem} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'clamp(50px, 6vw, 70px)', padding: '0.4rem 0.8rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', borderRadius: '0.8rem', border: '1px solid rgba(239, 68, 68, 0.3)', animation: 'none' }}>
                      <span style={{ fontSize: 'clamp(1.2rem, 3vh, 1.8rem)', lineHeight: 1, fontWeight: 800 }}>{ticketNum}</span>
                      {counterStr && <span style={{ fontSize: 'clamp(0.6rem, 1.5vh, 0.75rem)', opacity: 0.8, marginTop: '2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{counterStr}</span>}
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
