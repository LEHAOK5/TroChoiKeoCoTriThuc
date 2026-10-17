import React from 'react';

export default function FeedbackOverlay({ result }) {
  if (!result) return null;

  const isCorrect = result.isCorrect;
  const isBothWrong = !result.answeringTeam && !result.isCorrect;

  let borderColor = '#00E676';
  let title = 'CHÍNH XÁC! +1 ĐIỂM';
  let badgeIcon = '✅';

  if (isBothWrong) {
    borderColor = '#94A3B8';
    title = 'KHÔNG CÓ ĐỘI GHI ĐIỂM';
    badgeIcon = '⏱️';
  } else if (!isCorrect) {
    borderColor = '#FF1744';
    title = 'CHƯA CHÍNH XÁC!';
    badgeIcon = '❌';
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        right: '16px',
        background: 'rgba(11, 19, 43, 0.95)',
        border: `2px solid ${borderColor}`,
        borderRadius: 16,
        padding: '14px 18px',
        boxShadow: `0 0 20px ${borderColor}44`,
        zIndex: 40,
        animation: 'slideUp 0.3s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: '1.4rem' }}>{badgeIcon}</span>
        <strong style={{ color: borderColor, fontSize: '1.05rem', fontFamily: 'var(--font-title)' }}>
          {title}
        </strong>
      </div>

      {result.explanation && (
        <p style={{ fontSize: '0.88rem', color: '#E2E8F0', lineHeight: 1.4, margin: '4px 0 6px' }}>
          💡 <strong>Giải thích:</strong> {result.explanation}
        </p>
      )}

      <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        Tự động chuyển câu tiếp theo trong 3 giây...
      </small>
    </div>
  );
}
