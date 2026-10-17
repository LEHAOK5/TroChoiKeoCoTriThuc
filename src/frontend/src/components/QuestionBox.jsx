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
      <div className="quiz-card" style={{ boxShadow: 'var(--elev-2)' }}>
        <div className="quiz-meta">
          <span className={`topic-badge ${isIT ? 'topic-it' : 'topic-law'}`}>
            {isIT ? '💻 CÔNG NGHỆ THÔNG TIN' : '⚖️ PHÁP LUẬT ĐỜI SỐNG'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--color-steal)',
                fontWeight: 900,
                letterSpacing: 0.5,
                background: 'rgba(255, 214, 0, 0.1)',
                border: '1px solid rgba(255, 214, 0, 0.3)',
                padding: '3px 9px',
                borderRadius: 8
              }}
            >
              🎯 MỤC TIÊU 10 ĐIỂM
            </span>
            {deadline && (
              <RingTimer seconds={secondsLeft} totalSeconds={15} size={42} strokeWidth={3.5} />
            )}
          </div>
        </div>

        <div className="quiz-text">
          {question.question}
        </div>
      </div>
    </div>
  );
}
