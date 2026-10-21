import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playVictory } from '../utils/audio';

export default function VictoryModal({ gameOverData, onRematch }) {
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
    <div className="overlay-backdrop">
      <div className="overlay-card">
        {/* Big 2D Cartoon Trophy */}
        <div style={{ fontSize: '5rem', marginBottom: 4, filter: 'drop-shadow(0 6px 0 rgba(15, 23, 42, 0.2))' }}>
          🏆
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-title)',
            fontSize: '1.75rem',
            fontWeight: 900,
            color: isWinnerA ? '#1A1AFF' : (isWinnerB ? '#EA580C' : '#0F172A'),
            textTransform: 'uppercase',
            textShadow: '1.5px 1.5px 0 var(--comic-black)'
          }}
        >
          {isWinnerA ? 'ĐỘI A - TIA CHỚP VÔ ĐỊCH!' : isWinnerB ? 'ĐỘI B - NGỌN LỬA VÔ ĐỊCH!' : 'TRẬN ĐẤU BẤT PHÂN THẮNG BẠI!'}
        </h2>

        {/* Score Display Card */}
        <div
          style={{
            margin: '14px 0',
            background: '#F1F5F9',
            border: '2.5px solid var(--comic-black)',
            borderRadius: 16,
            padding: '10px 16px',
            boxShadow: '0 3px 0 var(--comic-black)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <span style={{ fontFamily: 'var(--font-title)', fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-muted)' }}>
            TỶ SỐ CHUNG CUỘC:
          </span>
          <span style={{ fontFamily: 'var(--font-title)', fontSize: '1.7rem', fontWeight: 900, color: '#1A1AFF' }}>
            {scoreA}
          </span>
          <span style={{ fontWeight: 900, color: 'var(--comic-black)' }}>-</span>
          <span style={{ fontFamily: 'var(--font-title)', fontSize: '1.7rem', fontWeight: 900, color: '#EA580C' }}>
            {scoreB}
          </span>
        </div>

        {/* Booth Instruction Card */}
        <div
          style={{
            background: '#FEF08A',
            border: '2px solid var(--comic-black)',
            borderRadius: 16,
            padding: '12px 14px',
            fontSize: '0.9rem',
            color: '#713F12',
            marginBottom: 20,
            boxShadow: '0 3px 0 var(--comic-black)',
            textAlign: 'left'
          }}
        >
          🎁 <strong>Thông báo gian hàng:</strong> Chúc mừng hai đội! Hãy cùng tiến đến <strong>Trạm 2</strong> để nhận quà kỷ niệm!
          {matchCode && (
            <div style={{ fontSize: '0.78rem', color: '#92400E', marginTop: 4, fontWeight: 700 }}>
              Mã trận đấu: <code style={{ background: '#FFF', padding: '2px 6px', borderRadius: 4, border: '1px solid #D97706' }}>{matchCode}</code>
            </div>
          )}
        </div>

        <button
          className="btn-tactile"
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(180deg, #4A4AFF 0%, #1A1AFF 100%)',
            color: '#FFFFFF',
            fontSize: '1.15rem',
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
