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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 10, padding: '0 4px' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.88rem' }}>
            📖 4 phương án trả lời (Khóa 🔒 - Bấm chuông bên dưới để mở):
          </span>
          {deadline && (
            <span className="timer-pill" style={{ background: 'rgba(255, 214, 0, 0.15)', borderColor: 'var(--color-steal)', color: 'var(--color-steal)' }}>
              ⏱️ {secondsLeft}s
            </span>
          )}
        </div>
      )}

      {isSelf && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 10, padding: '0 4px' }}>
          <span style={{ color: 'var(--team-a-cyan)', fontWeight: 900, fontSize: '1rem', textShadow: '0 0 10px var(--team-a-glow)' }}>
            ⚡ BẠN ĐÃ GIÀNH QUYỀN TRẢ LỜI! CHỌN 1 ĐÁP ÁN:
          </span>
          <span className="timer-pill" style={{ background: 'rgba(0, 240, 255, 0.2)', borderColor: 'var(--team-a-cyan)', color: 'var(--team-a-cyan)' }}>
            ⏱️ {secondsLeft}s
          </span>
        </div>
      )}

      {isOpponent && (
        <div
          style={{
            width: '100%',
            padding: '10px 14px',
            background: 'rgba(255, 107, 0, 0.15)',
            border: '1.5px solid var(--team-b-orange)',
            borderRadius: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10
          }}
        >
          <span style={{ color: 'var(--team-b-orange)', fontWeight: 800, fontSize: '0.9rem' }}>
            🔒 ĐỐI THỦ ({buzzerData?.team === 'A' ? 'ĐỘI A' : 'ĐỘI B'}) ĐANG TRẢ LỜI...
          </span>
          <span style={{ color: 'var(--color-steal)', fontSize: '0.8rem', fontWeight: 700 }}>
            Chuẩn bị cướp điểm nếu sai!
          </span>
        </div>
      )}

      {isSteal && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 10, padding: '0 4px' }}>
          <span style={{ color: 'var(--color-steal)', fontWeight: 900, fontSize: '1rem', textShadow: '0 0 10px rgba(255,214,0,0.5)' }}>
            ⚡ CƠ HỘI CƯỚP ĐIỂM! CHỌN ĐÁP ÁN ĐÚNG:
          </span>
          <span className="timer-pill" style={{ background: 'rgba(255, 214, 0, 0.25)', borderColor: 'var(--color-steal)', color: 'var(--color-steal)' }}>
            ⏱️ {secondsLeft}s
          </span>
        </div>
      )}

      {isLocked && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center', padding: '12px 0' }}>
          Đang chuẩn bị câu hỏi tiếp theo...
        </div>
      )}

      {/* THE ONLY 4 ANSWER OPTIONS ON SCREEN - UNLOCKS UPON BUZZ */}
      {!isLocked && options.length > 0 && (
        <div className="answer-grid">
          {options.map((opt, idx) => {
            const isEliminated = isSteal && reboundData && reboundData.eliminatedIndex === idx;
            const isSelected = selectedIdx === idx;

            let btnClass = 'answer-btn';
            if (isWaiting || isOpponent) btnClass += ' locked-answer';
            if (isSelf) btnClass += ' unlocked-self';
            if (isSteal && !isEliminated) btnClass += ' unlocked-steal';
            if (isEliminated) btnClass += ' eliminated';
            if (isSelected) btnClass += ' correct-glow';

            return (
              <button
                key={idx}
                className={`btn-tactile ${btnClass}`}
                disabled={!canClickAnswers || isEliminated || selectedIdx !== null}
                onClick={() => canClickAnswers && handleSelectOption(idx)}
                id={`answer-btn-${idx}`}
                style={{
                  cursor: canClickAnswers && !isEliminated ? 'pointer' : 'default',
                  opacity: isEliminated ? 0.35 : (isWaiting || isOpponent) ? 0.8 : 1,
                }}
              >
                <div className="glyph-badge">{GLYPHS[idx]}</div>
                <span style={{ flex: 1 }}>
                  <strong>{LETTERS[idx]}.</strong> {opt}
                </span>
                {(isWaiting || isOpponent) && (
                  <span style={{ fontSize: '0.85rem', opacity: 0.5 }}>🔒</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* BIG BUZZER BUTTON - ONLY PRESENT DURING QUESTION_WAITING TO UNLOCK */}
      {isWaiting && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 12 }}>
          <button
            className="btn-tactile buzzer-wide-btn"
            onClick={handleBuzzClick}
            id="buzzer-btn"
          >
            <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>🔔</span>
            <span>BẤM CHUÔNG ĐỂ MỞ KHÓA TRẢ LỜI</span>
          </button>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8, fontWeight: 600, textAlign: 'center' }}>
            ⚡ Bấm chuông thật nhanh để mở khóa 4 đáp án trên và chọn câu trả lời!
          </p>
        </div>
      )}
    </div>
  );
}
