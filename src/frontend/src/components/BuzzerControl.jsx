import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';
import TacticalCardBar from './TacticalCardBar';

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
  onSubmitAnswer,
  tacticalCards = {},
  roundActiveCard = null,
  playerTeam = 'A',
  isFrozen = false,
  frozenSecondsLeft = 0,
  fiftyFiftyEliminated = [],
  onUseCard = () => {}
}) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    if (isFrozen) return;
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
      {/* 🃏 Thanh Thẻ Bài Chiến Thuật (Tactical Cards) */}
      <TacticalCardBar
        teamCards={tacticalCards[playerTeam] || {}}
        roundActiveCard={roundActiveCard}
        uiState={uiState}
        playerTeam={playerTeam}
        buzzerData={buzzerData}
        reboundData={reboundData}
        onUseCard={onUseCard}
        isMobile={isMobile}
      />

      {/* Top Banner Status Bar based on UI State */}
      {isWaiting && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: isMobile ? 4 : 8, padding: '0 4px' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: isMobile ? '0.78rem' : '0.85rem' }}>
            {isMobile ? '🔔 Bấm chuông vàng để giành quyền trả lời:' : '🔒 Đọc kỹ 4 đáp án & Bấm chuông vàng để giành quyền trả lời:'}
          </span>
          {deadline && (
            <span className="timer-pill" style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', padding: isMobile ? '2px 8px' : '4px 10px' }}>
              ⏱️ {secondsLeft}s
            </span>
          )}
        </div>
      )}

      {isSelf && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 8, padding: '0 4px' }}>
          <span
            style={{
              color: '#1A1AFF',
              fontWeight: 900,
              fontSize: '0.98rem',
              background: '#E6E6FF',
              padding: '4px 12px',
              borderRadius: 999,
              border: '2px solid var(--comic-black)',
              boxShadow: '0 2px 0 var(--comic-black)'
            }}
          >
            ⚡ BẠN ĐÃ BẤM CHUÔNG! CHỌN 1 ĐÁP ÁN:
          </span>
          <span className="timer-pill" style={{ background: '#E6E6FF', color: '#1010CC' }}>
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
          const is5050Eliminated = Array.isArray(fiftyFiftyEliminated) && fiftyFiftyEliminated.includes(idx);
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

          if (isWrongEliminated || is5050Eliminated) {
            btnClass += ' eliminated';
          }

          if (isSelected) {
            btnClass += ' correct-glow';
          }

          const badgeTheme = [
            { bg: '#E6E6FF', text: '#1A1AFF' },
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
          } else if (is5050Eliminated) {
            btnBg = '#F1F5F9';
            btnBorder = '2px dashed #94A3B8';
            btnShadow = 'none';
          }

          return (
            <button
              key={idx}
              className={btnClass}
              disabled={!canClickAnswers || isWrongEliminated || is5050Eliminated || selectedIdx !== null}
              onClick={() => handleSelectOption(idx)}
              id={`answer-btn-${letter}`}
              style={{
                background: btnBg,
                border: btnBorder,
                boxShadow: btnShadow,
                color: is5050Eliminated ? '#94A3B8' : '#0F172A',
                opacity: is5050Eliminated ? 0.35 : 1,
                position: 'relative',
                transition: 'all 0.15s ease'
              }}
            >
              <div
                className="glyph-badge"
                style={{
                  background: isRevealedCorrect ? '#16A34A' : isRevealedWrong ? '#DC2626' : badgeTheme.bg,
                  color: (isRevealedCorrect || isRevealedWrong) ? '#FFFFFF' : badgeTheme.text,
                  border: '2px solid var(--comic-black)',
                  flexShrink: 0
                }}
              >
                <span style={{ fontFamily: 'var(--font-title)', fontWeight: 900, fontSize: isMobile ? '0.85rem' : '0.95rem' }}>
                  {letter}
                </span>
              </div>
              <span style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', marginRight: 6, flexShrink: 0 }}>{glyph}</span>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  lineHeight: 1.35,
                  fontWeight: 800,
                  fontSize: isMobile ? '0.84rem' : '0.98rem',
                  color: is5050Eliminated ? '#94A3B8' : '#0F172A',
                  textAlign: 'left',
                  wordBreak: 'normal',
                  overflowWrap: 'break-word',
                  whiteSpace: 'normal',
                  textDecoration: is5050Eliminated ? 'line-through' : 'none'
                }}
              >
                {opt}
              </span>

              {/* Reveal Checkmark or Cross */}
              {isRevealedCorrect && (
                <span style={{ fontSize: '1.2rem', color: '#16A34A', marginLeft: 'auto', fontWeight: 900, flexShrink: 0 }}>
                  ✅
                </span>
              )}
              {isRevealedWrong && (
                <span style={{ fontSize: '1.2rem', color: '#DC2626', marginLeft: 'auto', fontWeight: 900, flexShrink: 0 }}>
                  ❌
                </span>
              )}
              {is5050Eliminated && (
                <span style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%) rotate(-12deg)',
                  fontSize: '0.72rem',
                  color: '#DC2626',
                  fontWeight: 900,
                  border: '1.5px solid #DC2626',
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: 'rgba(254, 226, 226, 0.95)'
                }}>
                  BÁC BỎ ❌
                </span>
              )}
              {!isRevealedCorrect && !isRevealedWrong && !is5050Eliminated && (isWaiting || isOpponent || isLocked) && !isWrongEliminated && (
                <span
                  style={{
                    fontSize: '1.05rem',
                    marginLeft: 'auto',
                    flexShrink: 0,
                    display: 'inline-block',
                    animation: 'lockRock 2s infinite ease-in-out'
                  }}
                >
                  🔒
                </span>
              )}
              {isWrongEliminated && !isRevealedCorrect && !is5050Eliminated && (
                <span style={{ fontSize: '1.1rem', color: '#EF4444', marginLeft: 'auto', flexShrink: 0 }}>
                  ❌
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* GIANT 3D GOLDEN BELL BUZZER (Shown when waiting for players to buzz) */}
      {isWaiting && (
        <div style={{ marginTop: isMobile ? 8 : 14, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            className={`buzzer-tactile ${isFrozen ? 'buzzer-frozen' : ''}`}
            onClick={isFrozen ? undefined : handleBuzzClick}
            disabled={isFrozen}
            id="buzzer-giant-btn"
            style={isFrozen ? {
              background: 'linear-gradient(180deg, #BAE6FD 0%, #38BDF8 50%, #0284C7 100%)',
              borderColor: '#0369A1',
              color: '#0C4A6E',
              boxShadow: '0 4px 0 #075985, 0 0 16px rgba(56, 189, 248, 0.6)',
              cursor: 'not-allowed',
              transform: 'none'
            } : undefined}
            title={isFrozen ? `Đang bị đóng băng bởi DDoS! (${frozenSecondsLeft}s)` : "Đập chuông thật nhanh để giành quyền trả lời"}
          >
            <span className="buzzer-icon">{isFrozen ? '❄️' : '🔔'}</span>
            <span className="buzzer-label">
              {isFrozen ? `ĐÓNG BĂNG (${frozenSecondsLeft}s)` : 'BẤM CHUÔNG!'}
            </span>
          </button>
          <small style={{ marginTop: 6, color: isFrozen ? '#0284C7' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.78rem' }}>
            {isFrozen ? '🥶 Đang bị đối thủ DDoS đóng băng chuông!' : '⚡ Đập chuông nhanh để mở khóa 4 đáp án trên!'}
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
