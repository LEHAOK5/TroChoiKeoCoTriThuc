import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';

const GLYPHS = ['⚪', '🔺', '⏹️', '🔶'];
const LETTERS = ['A', 'B', 'C', 'D'];

export default function BuzzerControl({
  uiState, // 'QUESTION_WAITING', 'BUZZER_SELF', 'BUZZER_OPPONENT', 'STEAL_PHASE', 'LOCKED'
  options = [],
  deadline,
  buzzerData,
  reboundData,
  lastResult,
  onPressBuzzer,
  onSubmitAnswer
}) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    setSelectedIdx(null);
  }, [uiState]);

  useEffect(() => {
    if (!deadline) return;
    const updateTime = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    updateTime();
    const interval = setInterval(updateTime, 250);
    return () => clearInterval(interval);
  }, [deadline, uiState]);

  const handleBuzzClick = () => {
    triggerHaptic(50);
    onPressBuzzer();
  };

  const handleSelectOption = (idx) => {
    triggerHaptic([30, 20]);
    setSelectedIdx(idx);
    onSubmitAnswer(idx);
  };

  const isWaiting = uiState === 'QUESTION_WAITING';
  const isSelf = uiState === 'BUZZER_SELF';
  const isOpponent = uiState === 'BUZZER_OPPONENT';
  const isSteal = uiState === 'STEAL_PHASE';
  const isLocked = uiState === 'LOCKED';

  const canClickAnswers = isSelf || isSteal;

  return (
    <div className="interaction-tier" style={{ width: '100%', maxWidth: 740, margin: '0 auto' }}>
      {/* Top Banner Status Bar based on UI State */}
      {isWaiting && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 8, padding: '0 4px' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.85rem' }}>
            🔒 Đọc kỹ 4 đáp án & Bấm chuông vàng để giành quyền trả lời:
          </span>
          {deadline && (
            <span className="timer-pill">
              ⏱️ {secondsLeft}s
            </span>
          )}
        </div>
      )}

      {isSelf && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 8, padding: '0 4px' }}>
          <span
            style={{
              color: '#0284C7',
              fontWeight: 900,
              fontSize: '0.98rem',
              background: '#E0F2FE',
              padding: '4px 12px',
              borderRadius: 999,
              border: '2px solid var(--comic-black)',
              boxShadow: '0 2px 0 var(--comic-black)'
            }}
          >
            ⚡ BẠN ĐÃ BẤM CHUÔNG! CHỌN 1 ĐÁP ÁN:
          </span>
          <span className="timer-pill" style={{ background: '#E0F2FE', color: '#0369A1' }}>
            ⏱️ {secondsLeft}s
          </span>
        </div>
      )}

      {isOpponent && (
        <div
          style={{
            width: '100%',
            padding: '8px 14px',
            background: '#FFEDD5',
            border: '2.5px solid var(--comic-black)',
            borderRadius: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
            boxShadow: '0 3px 0 var(--comic-black)'
          }}
        >
          <span style={{ color: '#C2410C', fontWeight: 900, fontSize: '0.88rem' }}>
            🔒 ĐỐI THỦ ({buzzerData?.team === 'A' ? 'ĐỘI A' : 'ĐỘI B'}) ĐANG TRẢ LỜI...
          </span>
          <span style={{ color: '#9A3412', fontSize: '0.78rem', fontWeight: 800 }}>
            Chuẩn bị cướp điểm nếu sai!
          </span>
        </div>
      )}

      {isSteal && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 8, padding: '0 4px' }}>
          <span
            style={{
              color: '#B45309',
              fontWeight: 900,
              fontSize: '0.98rem',
              background: '#FEF08A',
              padding: '4px 12px',
              borderRadius: 999,
              border: '2px solid var(--comic-black)',
              boxShadow: '0 2px 0 var(--comic-black)'
            }}
          >
            🎯 ĐỐI THỦ SAI! CƠ HỘI CƯỚP ĐIỂM CỦA BẠN:
          </span>
          <span className="timer-pill" style={{ background: '#FEF08A', color: '#713F12' }}>
            ⏱️ {secondsLeft}s
          </span>
        </div>
      )}

      {/* 2x2 Answer Grid */}
      <div className="answer-grid">
        {options.map((opt, idx) => {
          const letter = LETTERS[idx];
          const glyph = GLYPHS[idx];
          const isSelected = selectedIdx === idx;
          const isWrongEliminated = reboundData?.wrongOptionIndex === idx;
          const isRevealedCorrect = isLocked && lastResult && Number(lastResult.correctIndex) === idx;
          const isRevealedWrong = isLocked && lastResult && isSelected && !lastResult.isCorrect;

          let btnClass = 'answer-btn';
          if (isWaiting || isOpponent || isLocked) {
            btnClass += ' locked-answer';
          } else if (isSelf) {
            btnClass += ' unlocked-self';
          } else if (isSteal) {
            btnClass += ' unlocked-steal';
          }

          if (isWrongEliminated) {
            btnClass += ' eliminated';
          }

          if (isSelected) {
            btnClass += ' correct-glow';
          }

          const badgeTheme = [
            { bg: '#E0F2FE', text: '#0284C7' },
            { bg: '#EDE9FE', text: '#7C3AED' },
            { bg: '#FEF3C7', text: '#D97706' },
            { bg: '#FFE4E6', text: '#E11D48' }
          ][idx % 4];

          // Determine button surface when revealing answers
          let btnBg = '#FFFFFF';
          let btnBorder = '2.5px solid var(--comic-black)';
          let btnShadow = '0 4px 0 var(--comic-black)';

          if (isRevealedCorrect) {
            btnBg = '#DCFCE7';
            btnBorder = '2.5px solid #16A34A';
            btnShadow = '0 4px 0 #15803D';
          } else if (isRevealedWrong) {
            btnBg = '#FEE2E2';
            btnBorder = '2.5px solid #DC2626';
            btnShadow = '0 4px 0 #991B1B';
          }

          return (
            <button
              key={idx}
              className={btnClass}
              disabled={!canClickAnswers || isWrongEliminated || selectedIdx !== null}
              onClick={() => handleSelectOption(idx)}
              id={`answer-btn-${letter}`}
              style={{
                background: btnBg,
                border: btnBorder,
                boxShadow: btnShadow,
                color: '#0F172A',
                transition: 'all 0.15s ease'
              }}
            >
              <div
                className="glyph-badge"
                style={{
                  background: isRevealedCorrect ? '#16A34A' : isRevealedWrong ? '#DC2626' : badgeTheme.bg,
                  color: (isRevealedCorrect || isRevealedWrong) ? '#FFFFFF' : badgeTheme.text,
                  border: '2px solid var(--comic-black)'
                }}
              >
                <span style={{ fontFamily: 'var(--font-title)', fontWeight: 900, fontSize: '0.95rem' }}>
                  {letter}
                </span>
              </div>
              <span style={{ fontSize: '1.1rem', marginRight: 4 }}>{glyph}</span>
              <span style={{ flex: 1, lineHeight: 1.4, fontWeight: 800, fontSize: '0.98rem', color: '#0F172A' }}>
                {opt}
              </span>

              {/* Reveal Checkmark or Cross */}
              {isRevealedCorrect && (
                <span style={{ fontSize: '1.3rem', color: '#16A34A', marginLeft: 'auto', fontWeight: 900 }}>
                  ✅
                </span>
              )}
              {isRevealedWrong && (
                <span style={{ fontSize: '1.3rem', color: '#DC2626', marginLeft: 'auto', fontWeight: 900 }}>
                  ❌
                </span>
              )}
              {!isRevealedCorrect && !isRevealedWrong && (isWaiting || isOpponent || isLocked) && !isWrongEliminated && (
                <span
                  style={{
                    fontSize: '1.15rem',
                    marginLeft: 'auto',
                    display: 'inline-block',
                    animation: 'lockRock 2s infinite ease-in-out'
                  }}
                >
                  🔒
                </span>
              )}
              {isWrongEliminated && !isRevealedCorrect && (
                <span style={{ fontSize: '1.2rem', color: '#EF4444', marginLeft: 'auto' }}>
                  ❌
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* GIANT 3D GOLDEN BELL BUZZER (Shown when waiting for players to buzz) */}
      {isWaiting && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            className="buzzer-tactile"
            onClick={handleBuzzClick}
            id="buzzer-giant-btn"
            title="Đập chuông thật nhanh để giành quyền trả lời"
          >
            <span className="buzzer-icon">🔔</span>
            <span className="buzzer-label">BẤM CHUÔNG!</span>
          </button>
          <small style={{ marginTop: 6, color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.78rem' }}>
            ⚡ Đập chuông nhanh để mở khóa 4 đáp án trên!
          </small>
        </div>
      )}

      {/* Wide buzzer if in steal phase */}
      {isSteal && (
        <div style={{ marginTop: 12, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div className="buzzer-wide-btn" style={{ background: '#FEF08A', color: '#713F12' }}>
            <span>⚡ HÃY CHỌN 1 TRONG CÁC ĐÁP ÁN CÒN LẠI!</span>
          </div>
        </div>
      )}
    </div>
  );
}
