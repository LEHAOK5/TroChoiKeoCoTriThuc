import React, { useState, useEffect } from 'react';
import RingTimer from './RingTimer';

export default function QuestionBox({ question, deadline }) {
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!deadline) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!question) return null;

  const isIT = question.category === 'IT';

  return (
    <div className="question-tier">
      <div className="quiz-card" style={{ padding: isMobile ? '6px 10px' : '12px 18px' }}>
        {/* Header Metadata with Comic Badges */}
        <div className="quiz-meta" style={{ gap: isMobile ? 4 : 10, marginBottom: isMobile ? 4 : 8 }}>
          <span className={`topic-badge ${isIT ? 'topic-it' : 'topic-law'}`} style={{ fontSize: isMobile ? '0.7rem' : '0.85rem', padding: isMobile ? '2px 8px' : '4px 12px' }}>
            {isIT ? '💻 CÔNG NGHỆ THÔNG TIN' : '⚖️ PHÁP LUẬT ĐỜI SỐNG'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 10 }}>
            <span
              style={{
                fontSize: isMobile ? '0.68rem' : '0.78rem',
                fontFamily: 'var(--font-title)',
                color: '#713F12',
                fontWeight: 900,
                background: '#FEF08A',
                border: '2px solid var(--comic-black)',
                boxShadow: '0 2px 0 var(--comic-black)',
                padding: isMobile ? '2px 6px' : '4px 10px',
                borderRadius: 999,
                whiteSpace: 'nowrap'
              }}
            >
              {isMobile ? '🎯 10đ' : '🎯 MỤC TIÊU 10đ'}
            </span>
            {deadline && (
              <RingTimer seconds={secondsLeft} totalSeconds={15} size={isMobile ? 32 : 44} strokeWidth={isMobile ? 3 : 4} />
            )}
          </div>
        </div>

        {/* Question Text */}
        <div
          className="quiz-text"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: isMobile ? '0.88rem' : '1.08rem',
            fontWeight: 800,
            color: '#0F172A',
            lineHeight: isMobile ? 1.35 : 1.5,
            paddingTop: 1
          }}
        >
          {question.question}
        </div>
      </div>
    </div>
  );
}
