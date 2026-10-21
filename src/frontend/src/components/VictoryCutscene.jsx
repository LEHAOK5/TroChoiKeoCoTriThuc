import React, { useState, useEffect } from 'react';
import PullerCharacter from './PullerCharacter';
import RefereeCharacter from './RefereeCharacter';
import { playRopePull, playWhistle } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

export default function VictoryCutscene({ winner = 'A', onDone }) {
  // 2-Phases: 'PULL' (0-1.8s: Giằng co nghẹt thở) -> 'FALL' (1.8-4.2s: Kéo phăng ngã đối thủ) -> onDone()
  const [phase, setPhase] = useState('PULL');
  const [canSkip, setCanSkip] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isWinnerA = winner === 'A';

  useEffect(() => {
    // Initial sound & haptic
    playRopePull();
    triggerHaptic([60, 40, 100]);

    // Timer: Enable skip button after 1s
    const skipTimer = setTimeout(() => setCanSkip(true), 1000);

    // Timer: Phase 2 - Fall & Slapstick (1.8s)
    const fallTimer = setTimeout(() => {
      setPhase('FALL');
      playWhistle();
      triggerHaptic([100, 50, 180]);
    }, 1800);

    // Timer: Finish cutscene after 4.2s and transition to personalized team result
    const doneTimer = setTimeout(() => {
      onDone();
    }, 4200);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(fallTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  // Rope offset shifts dynamically per phase
  let ropeOffset = 0;
  if (phase === 'PULL') ropeOffset = isWinnerA ? -4 : 4;
  if (phase === 'FALL') ropeOffset = isWinnerA ? -10 : 10;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'radial-gradient(circle at center, #2626FF 0%, #1A1AFF 52%, #0C0C8F 85%, #08085C 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '8px' : '16px',
        overflow: 'hidden',
        userSelect: 'none'
      }}
      className={phase === 'FALL' ? 'screen-shake-anim' : ''}
    >
      {/* Tia sáng Manga Action Sunburst Background */}
      <div
        style={{
          position: 'absolute',
          width: '180vw',
          height: '180vh',
          background: 'repeating-conic-gradient(from 0deg, rgba(254, 240, 138, 0.18) 0deg 15deg, rgba(255, 255, 255, 0.08) 15deg 30deg)',
          animation: 'starSpin 30s infinite linear',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* KHUNG SÂN ĐẤU CHÍNH (2D Neo-Brutalism Stadium Box) */}
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          background: '#FFFFFF',
          border: '3.5px solid var(--comic-black)',
          borderRadius: isMobile ? 16 : 24,
          boxShadow: isMobile ? '0 6px 0 var(--comic-black)' : '0 12px 0 var(--comic-black)',
          position: 'relative',
          zIndex: 10,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* BANNER TIÊU ĐỀ GIAI ĐOẠN TRẬN ĐẤU */}
        <div
          style={{
            background: phase === 'FALL' ? '#EF4444' : '#1A1AFF',
            borderBottom: '3px solid var(--comic-black)',
            padding: isMobile ? '8px 10px' : '12px 18px',
            textAlign: 'center',
            color: '#FFFFFF',
            fontFamily: 'var(--font-title)',
            fontWeight: 900,
            fontSize: isMobile ? '0.88rem' : '1.25rem',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            textShadow: '1.5px 1.5px 0 var(--comic-black)',
            transition: 'background 0.3s ease'
          }}
        >
          {phase === 'PULL' && <span>⚡ CÚ KÉO QUYẾT ĐỊNH — DỒN TOÀN LỰC! ⚡</span>}
          {phase === 'FALL' && <span>💥 KÉO PHĂNG ĐỐI THỦ — ĐỔI CỤC DIỆN! 💥</span>}
        </div>

        {/* KHÔNG GIAN ĐẤU TRƯỜNG KÉO CO 2D (Grass Arena) */}
        <div
          style={{
            height: isMobile ? '200px' : '250px',
            background: 'linear-gradient(180deg, #166534 0%, #15803D 50%, #14532D 100%)',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: isMobile ? '14px' : '22px',
            overflow: 'hidden'
          }}
        >
          {/* Sọc sân cỏ & Vạch ranh giới trung tâm */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              bottom: 0,
              width: '4px',
              background: '#FFFFFF',
              transform: 'translateX(-50%)',
              zIndex: 2,
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.6)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              bottom: 0,
              width: isMobile ? '50px' : '80px',
              borderLeft: '2px dashed rgba(255, 255, 255, 0.4)',
              borderRight: '2px dashed rgba(255, 255, 255, 0.4)',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              zIndex: 2
            }}
          />

          {/* VỊ THẨM PHÁN VHU Ở GIỮA */}
          <div
            style={{
              position: 'absolute',
              bottom: isMobile ? '10px' : '18px',
              left: '50%',
              transform: isMobile ? 'translateX(-50%) scale(0.72)' : 'translateX(-50%)',
              transformOrigin: 'bottom center',
              zIndex: 6
            }}
          >
            <RefereeCharacter
              ropeOffset={ropeOffset}
              lastResult={{ isCorrect: true }}
              isBuzzed={phase === 'FALL'}
              winner={winner}
            />
          </div>

          {/* DÂY THỪNG THI ĐẤU (Rope) */}
          <div
            style={{
              position: 'absolute',
              left: '3%',
              right: '3%',
              bottom: isMobile ? '38px' : '48px',
              height: isMobile ? '10px' : '14px',
              background: 'repeating-linear-gradient(45deg, #D4A373, #D4A373 10px, #B08968 10px, #B08968 20px)',
              border: '2px solid var(--comic-black)',
              borderRadius: 7,
              zIndex: 4,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
              transform: `translateX(${ropeOffset * (isMobile ? 6 : 10)}px)`,
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Cờ ruy băng đỏ mốc tâm */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: isMobile ? '-12px' : '-16px',
                transform: 'translateX(-50%)',
                width: isMobile ? '14px' : '18px',
                height: isMobile ? '24px' : '32px',
                background: '#DC2626',
                border: '2px solid var(--comic-black)',
                borderRadius: 4,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}
            >
              <span style={{ fontSize: isMobile ? '8px' : '10px', display: 'block', textAlign: 'center', lineHeight: isMobile ? '20px' : '28px', color: '#FFF' }}>
                🚩
              </span>
            </div>
          </div>

          {/* ======================================================= */}
          {/* ĐỘI A (BÊN TRÁI - ÁO XANH DƯƠNG VHU) */}
          {/* ======================================================= */}
          <div
            style={{
              position: 'absolute',
              left: isMobile ? (isWinnerA ? '2%' : (phase === 'FALL' ? '18%' : '4%')) : (isWinnerA ? '6%' : (phase === 'FALL' ? '28%' : '10%')),
              bottom: isMobile ? '12px' : '22px',
              display: 'flex',
              gap: isMobile ? '2px' : '6px',
              alignItems: 'flex-end',
              zIndex: 5,
              transition: 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: isMobile
                ? (!isWinnerA && phase === 'FALL' ? 'scale(0.62) rotate(15deg) translateY(18px)' : 'scale(0.62)')
                : (!isWinnerA && phase === 'FALL' ? 'rotate(15deg) translateY(18px)' : 'none'),
              transformOrigin: 'bottom left'
            }}
          >
            {[0, 1, 2, 3, 4].map((idx) => (
              <PullerCharacter
                key={`teamA_${idx}`}
                team="A"
                index={idx}
                isPulling={isWinnerA && phase === 'PULL'}
                isFallen={!isWinnerA && phase === 'FALL'}
                isCheering={isWinnerA && phase === 'FALL'}
              />
            ))}

            {/* Bong bóng thoại Đội A */}
            {isWinnerA && phase === 'PULL' && (
              <div
                style={{
                  position: 'absolute',
                  top: isMobile ? '-36px' : '-45px',
                  left: '10px',
                  background: '#FEF08A',
                  border: '2px solid var(--comic-black)',
                  boxShadow: '0 3px 0 var(--comic-black)',
                  borderRadius: 14,
                  padding: isMobile ? '2px 8px' : '4px 10px',
                  fontWeight: 900,
                  fontSize: isMobile ? '0.72rem' : '0.82rem',
                  fontFamily: 'var(--font-title)',
                  color: '#713F12',
                  whiteSpace: 'nowrap',
                  animation: 'comicPop 0.3s ease-out'
                }}
              >
                ⚡ 1... 2... KÉO PHĂNG! 💨
              </div>
            )}

            {!isWinnerA && phase === 'FALL' && (
              <div
                style={{
                  position: 'absolute',
                  top: isMobile ? '-36px' : '-45px',
                  right: '0',
                  background: '#FEE2E2',
                  border: '2px solid var(--comic-black)',
                  boxShadow: '0 3px 0 var(--comic-black)',
                  borderRadius: 14,
                  padding: isMobile ? '2px 8px' : '4px 10px',
                  fontWeight: 900,
                  fontSize: isMobile ? '0.72rem' : '0.82rem',
                  fontFamily: 'var(--font-title)',
                  color: '#991B1B',
                  whiteSpace: 'nowrap',
                  animation: 'comicPop 0.3s ease-out'
                }}
              >
                😵 Úi giời ơi té rồi! 💫
              </div>
            )}
          </div>

          {/* ======================================================= */}
          {/* ĐỘI B (BÊN PHẢI - ÁO CAM VHU) */}
          {/* ======================================================= */}
          <div
            style={{
              position: 'absolute',
              right: isMobile ? (!isWinnerA ? '2%' : (phase === 'FALL' ? '18%' : '4%')) : (!isWinnerA ? '6%' : (phase === 'FALL' ? '28%' : '10%')),
              bottom: isMobile ? '12px' : '22px',
              display: 'flex',
              gap: isMobile ? '2px' : '6px',
              alignItems: 'flex-end',
              zIndex: 5,
              transition: 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: isMobile
                ? (isWinnerA && phase === 'FALL' ? 'scale(0.62) rotate(-15deg) translateY(18px)' : 'scale(0.62)')
                : (isWinnerA && phase === 'FALL' ? 'rotate(-15deg) translateY(18px)' : 'none'),
              transformOrigin: 'bottom right'
            }}
          >
            {[4, 3, 2, 1, 0].map((idx) => (
              <PullerCharacter
                key={`teamB_${idx}`}
                team="B"
                index={idx}
                isPulling={!isWinnerA && phase === 'PULL'}
                isFallen={isWinnerA && phase === 'FALL'}
                isCheering={!isWinnerA && phase === 'FALL'}
              />
            ))}

            {/* Bong bóng thoại Đội B */}
            {!isWinnerA && phase === 'PULL' && (
              <div
                style={{
                  position: 'absolute',
                  top: isMobile ? '-36px' : '-45px',
                  right: '10px',
                  background: '#FFEDD5',
                  border: '2px solid var(--comic-black)',
                  boxShadow: '0 3px 0 var(--comic-black)',
                  borderRadius: 14,
                  padding: isMobile ? '2px 8px' : '4px 10px',
                  fontWeight: 900,
                  fontSize: isMobile ? '0.72rem' : '0.82rem',
                  fontFamily: 'var(--font-title)',
                  color: '#9A3412',
                  whiteSpace: 'nowrap',
                  animation: 'comicPop 0.3s ease-out'
                }}
              >
                🔥 DÔ TA! RÁNG LÊN NÀO! 💨
              </div>
            )}

            {isWinnerA && phase === 'FALL' && (
              <div
                style={{
                  position: 'absolute',
                  top: isMobile ? '-36px' : '-45px',
                  left: '0',
                  background: '#FEE2E2',
                  border: '2px solid var(--comic-black)',
                  boxShadow: '0 3px 0 var(--comic-black)',
                  borderRadius: 14,
                  padding: isMobile ? '2px 8px' : '4px 10px',
                  fontWeight: 900,
                  fontSize: isMobile ? '0.72rem' : '0.82rem',
                  fontFamily: 'var(--font-title)',
                  color: '#991B1B',
                  whiteSpace: 'nowrap',
                  animation: 'comicPop 0.3s ease-out'
                }}
              >
                💫 Oái mất đà rồi! 😵
              </div>
            )}
          </div>
        </div>

        {/* THÔNG BÁO DƯỚI KHUNG SÂN ĐẤU */}
        <div
          style={{
            padding: isMobile ? '12px 14px' : '16px 20px',
            textAlign: 'center',
            background: '#FFFFFF',
            position: 'relative'
          }}
        >
          <div style={{ minHeight: isMobile ? '50px' : '65px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p
              style={{
                fontFamily: 'var(--font-title)',
                fontSize: isMobile ? '0.92rem' : '1.15rem',
                fontWeight: 900,
                color: '#0F172A',
                margin: '0 0 4px 0'
              }}
            >
              {phase === 'PULL' ? '⏳ Hai đội đang giằng co nghẹt thở từng centimet dây...' : '🎺 Vị Thẩm Phán đã gõ búa xác nhận kết quả hiệp đấu!'}
            </p>
            <span style={{ fontSize: isMobile ? '0.74rem' : '0.85rem', color: '#64748B', fontWeight: 700 }}>
              {phase === 'PULL' ? 'Ai sẽ là người kéo phăng vạch phân cách trước?' : 'Đang chuyển đến kết quả phân định cho 2 đội...'}
            </span>
          </div>
        </div>
      </div>

      {/* NÚT BỎ QUA CUTSCENE */}
      <button
        onClick={onDone}
        id="btn-skip-victory-cutscene"
        style={{
          marginTop: isMobile ? '12px' : '20px',
          background: '#FFFFFF',
          border: '2.5px solid var(--comic-black)',
          boxShadow: isMobile ? '0 3px 0 var(--comic-black)' : '0 5px 0 var(--comic-black)',
          borderRadius: 999,
          padding: isMobile ? '8px 18px' : '10px 24px',
          color: '#0F172A',
          fontFamily: 'var(--font-title)',
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          fontWeight: 900,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 20,
          opacity: canSkip ? 1 : 0.6,
          pointerEvents: canSkip ? 'auto' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <span>Bỏ qua Cutscene</span>
        <span>⏩</span>
      </button>
    </div>
  );
}
