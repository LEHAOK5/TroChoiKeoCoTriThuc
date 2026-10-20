import React, { useState, useEffect } from 'react';
import RingTimer from './RingTimer';

export default function QuestionBox({ question, deadline }) {
  const [secondsLeft, setSecondsLeft] = useState(15);

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
      <div className="quiz-card">
        {/* Header Metadata with Comic Badges */}
        <div className="quiz-meta">
          <span className={`topic-badge ${isIT ? 'topic-it' : 'topic-law'}`}>
            {isIT ? '💻 CÔNG NGHỆ THÔNG TIN' : '⚖️ PHÁP LUẬT ĐỜI SỐNG'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontFamily: 'var(--font-title)',
                color: '#713F12',
                fontWeight: 900,
                background: '#FEF08A',
                border: '2px solid var(--comic-black)',
                boxShadow: '0 2px 0 var(--comic-black)',
                padding: '4px 10px',
                borderRadius: 999
              }}
            >
              🎯 MỤC TIÊU 10đ
            </span>
            {deadline && (
              <RingTimer seconds={secondsLeft} totalSeconds={15} size={44} strokeWidth={4} />
            )}
          </div>
        </div>

        {/* Question Text */}
        <div
          className="quiz-text"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.08rem',
            fontWeight: 800,
            color: '#0F172A',
            lineHeight: 1.5,
            paddingTop: 4
          }}
        >
          {question.question}
        </div>
      </div>
    </div>
  );
}
