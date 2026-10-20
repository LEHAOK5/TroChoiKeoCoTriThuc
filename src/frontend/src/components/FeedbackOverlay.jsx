import React from 'react';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function FeedbackOverlay({ result }) {
  if (!result) return null;

  const isCorrect = result.isCorrect;
  const reason = result.reason;
  const isBothWrong = !result.answeringTeam && !result.isCorrect;

  let borderColor = '#16A34A';
  let bgColor = '#DCFCE7';
  let textColor = '#166534';
  let title = result.title || (isCorrect ? 'CHÍNH XÁC! +1 ĐIỂM 🎉' : 'CHƯA CHÍNH XÁC! ❌');
  let badgeIcon = '✅';
  let subtitle = result.message || '';

  if (isBothWrong || reason) {
    if (reason === 'BOTH_INCORRECT' || (!reason && isBothWrong)) {
      borderColor = '#DC2626';
      bgColor = '#FEE2E2';
      textColor = '#991B1B';
      title = result.title || 'CẢ 2 ĐỘI ĐỀU TRẢ LỜI SAI! 💥';
      badgeIcon = '❌';
      subtitle = result.message || 'Cả hai đội đều không đưa ra câu trả lời chính xác!';
    } else if (reason === 'BUZZER_TIMEOUT') {
      borderColor = '#64748B';
      bgColor = '#F1F5F9';
      textColor = '#334155';
      title = result.title || 'HẾT GIỜ BẤM CHUÔNG! ⏱️';
      badgeIcon = '⏳';
      subtitle = result.message || 'Không có đội nào bấm chuông giành quyền trả lời!';
    } else if (reason === 'REBOUND_TIMEOUT') {
      borderColor = '#D97706';
      bgColor = '#FEF3C7';
      textColor = '#92400E';
      title = result.title || 'HẾT GIỜ CƯỚP ĐIỂM! ⏱️';
      badgeIcon = '⏱️';
      subtitle = result.message || 'Hết thời gian suy nghĩ cướp điểm!';
    }
  } else if (!isCorrect) {
    borderColor = '#DC2626';
    bgColor = '#FEE2E2';
    textColor = '#991B1B';
    title = result.title || (result.answeringTeam === 'A' ? 'ĐỘI A TRẢ LỜI SAI! ❌' : 'ĐỘI B TRẢ LỜI SAI! ❌');
    badgeIcon = '💥';
  } else if (isCorrect) {
    title = result.title || (result.answeringTeam === 'A' ? 'ĐỘI A TRẢ LỜI ĐÚNG! +1 ĐIỂM 🎉' : 'ĐỘI B TRẢ LỜI ĐÚNG! +1 ĐIỂM 🎉');
  }

  const correctLetter = (result.correctIndex !== undefined && result.correctIndex !== null)
    ? LETTERS[result.correctIndex]
    : '';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '12px',
        left: '14px',
        right: '14px',
        background: '#FFFFFF',
        border: '3px solid var(--comic-black)',
        borderRadius: 20,
        padding: '14px 18px',
        boxShadow: '0 8px 0 var(--comic-black)',
        zIndex: 50,
        animation: 'slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
    >
      {/* Header bar: Badge status + timer reminder */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: bgColor,
            color: textColor,
            border: '2px solid var(--comic-black)',
            padding: '5px 14px',
            borderRadius: 999,
            boxShadow: '0 2px 0 var(--comic-black)'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>{badgeIcon}</span>
          <strong style={{ fontSize: '1.02rem', fontFamily: 'var(--font-title)', fontWeight: 900 }}>
            {title}
          </strong>
        </div>

        <small style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 800 }}>
          ⏳ Chuyển câu sau 3.5s...
        </small>
      </div>

      {/* Subtitle / Context message */}
      {subtitle && (
        <div style={{ fontSize: '0.86rem', color: '#334155', fontWeight: 700, marginBottom: 8 }}>
          📢 {subtitle}
        </div>
      )}

      {/* Correct answer display box */}
      {result.correctOption && (
        <div
          style={{
            background: '#DCFCE7',
            border: '2px solid #16A34A',
            borderRadius: 12,
            padding: '8px 14px',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#166534' }}>
            🎯 Đáp án chính xác:
          </span>
          <strong style={{ fontSize: '0.98rem', color: '#15803D', fontFamily: 'var(--font-title)' }}>
            {correctLetter ? `[${correctLetter}] ` : ''}{result.correctOption}
          </strong>
        </div>
      )}

      {/* Detailed explanation */}
      {result.explanation && (
        <div
          style={{
            background: '#F8FAFC',
            border: '1.5px dashed #CBD5E1',
            borderRadius: 12,
            padding: '8px 12px'
          }}
        >
          <p style={{ fontSize: '0.86rem', color: '#1E293B', lineHeight: 1.45, margin: 0, fontWeight: 600 }}>
            💡 <strong>Giải thích:</strong> {result.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
