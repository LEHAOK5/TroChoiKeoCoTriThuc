import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playVictory } from '../utils/audio';
import JailCellMemeBox from './JailCellMemeBox';

export default function VictoryModal({ gameOverData, onRematch }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!gameOverData) return null;

  const { winner, scoreA, scoreB, matchCode } = gameOverData;
  const isWinnerA = winner === 'A';
  const isWinnerB = winner === 'B';

  useEffect(() => {
    playVictory();
    // Confetti cannons from left and right
    const end = Date.now() + 3.5 * 1000;
    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: isWinnerA ? ['#1A1AFF', '#4A4AFF', '#FFFFFF', '#FACC15'] : ['#FF5722', '#F97316', '#FFFFFF', '#FACC15']
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: isWinnerA ? ['#1A1AFF', '#4A4AFF', '#FFFFFF', '#FACC15'] : ['#FF5722', '#F97316', '#FFFFFF', '#FACC15']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [isWinnerA, isWinnerB]);

  return (
    <div className="overlay-backdrop" style={{ padding: isMobile ? '8px' : '20px' }}>
      <div className="overlay-card" style={{ padding: isMobile ? '14px 12px' : '22px 18px' }}>
        {/* Big 2D Cartoon Trophy */}
        <div
          style={{
            fontSize: isMobile ? '2.8rem' : '4.2rem',
            lineHeight: 1,
            marginBottom: isMobile ? 2 : 4,
            filter: 'drop-shadow(0 4px 0 rgba(15, 23, 42, 0.2))'
          }}
        >
          🏆
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-title)',
            fontSize: isMobile ? '1.25rem' : '1.6rem',
            fontWeight: 900,
            color: isWinnerA ? '#1A1AFF' : (isWinnerB ? '#EA580C' : '#0F172A'),
            textTransform: 'uppercase',
            textShadow: '1.5px 1.5px 0 var(--comic-black)',
            margin: isMobile ? '2px 0 6px 0' : '0 0 10px 0',
            lineHeight: 1.2
          }}
        >
          {isWinnerA ? 'ĐỘI A - TIA CHỚP VÔ ĐỊCH!' : isWinnerB ? 'ĐỘI B - NGỌN LỬA VÔ ĐỊCH!' : 'TRẬN ĐẤU BẤT PHÂN THẮNG BẠI!'}
        </h2>

        {/* Score Display Card */}
        <div
          style={{
            margin: isMobile ? '2px 0 8px 0' : '4px 0 12px 0',
            background: '#F1F5F9',
            border: '2px solid var(--comic-black)',
            borderRadius: 14,
            padding: isMobile ? '4px 12px' : '8px 16px',
            boxShadow: '0 2.5px 0 var(--comic-black)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: isMobile ? 8 : 12
          }}
        >
          <span style={{ fontFamily: 'var(--font-title)', fontSize: isMobile ? '0.8rem' : '0.92rem', fontWeight: 900, color: 'var(--text-muted)' }}>
            TỶ SỐ CHUNG CUỘC:
          </span>
          <span style={{ fontFamily: 'var(--font-title)', fontSize: isMobile ? '1.35rem' : '1.6rem', fontWeight: 900, color: '#1A1AFF' }}>
            {scoreA}
          </span>
          <span style={{ fontWeight: 900, color: 'var(--comic-black)' }}>-</span>
          <span style={{ fontFamily: 'var(--font-title)', fontSize: isMobile ? '1.35rem' : '1.6rem', fontWeight: 900, color: '#EA580C' }}>
            {scoreB}
          </span>
        </div>

        {/* Khung hình meme hài hước: Đội thua bị tống giam vào tù */}
        {(isWinnerA || isWinnerB) && (
          <div style={{ marginBottom: isMobile ? 8 : 12 }}>
            <JailCellMemeBox
              loserTeam={isWinnerA ? 'B' : 'A'}
              loserName={isWinnerA ? 'ĐỘI B - NGỌN LỬA' : 'ĐỘI A - TIA CHỚP'}
              isCompact={true}
            />
          </div>
        )}

        {/* Booth Instruction Card */}
        <div
          style={{
            background: '#FEF08A',
            border: '2px solid var(--comic-black)',
            borderRadius: 14,
            padding: isMobile ? '7px 10px' : '10px 14px',
            fontSize: isMobile ? '0.78rem' : '0.88rem',
            color: '#713F12',
            marginBottom: isMobile ? 10 : 14,
            boxShadow: '0 2.5px 0 var(--comic-black)',
            textAlign: 'left',
            lineHeight: 1.3
          }}
        >
          🎁 <strong>Thông báo gian hàng:</strong> Chúc mừng hai đội! Hãy cùng tiến đến <strong>Trạm 2</strong> để nhận quà kỷ niệm!
          {matchCode && (
            <div style={{ fontSize: '0.72rem', color: '#92400E', marginTop: 3, fontWeight: 700 }}>
              Mã trận đấu: <code style={{ background: '#FFF', padding: '1px 5px', borderRadius: 4, border: '1px solid #D97706' }}>{matchCode}</code>
            </div>
          )}
        </div>

        <button
          className="btn-tactile"
          style={{
            width: '100%',
            padding: isMobile ? '11px' : '14px',
            background: 'linear-gradient(180deg, #4A4AFF 0%, #1A1AFF 100%)',
            color: '#FFFFFF',
            fontSize: isMobile ? '0.98rem' : '1.1rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}
          onClick={onRematch}
          id="rematch-btn"
        >
          CHƠI LẠI TRẬN MỚI 🔄
        </button>
      </div>
    </div>
  );
}
