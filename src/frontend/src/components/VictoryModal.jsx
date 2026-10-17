import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playVictory } from '../utils/audio';

export default function VictoryModal({ gameOverData, onRematch }) {
  if (!gameOverData) return null;

  const { winner, scoreA, scoreB, matchCode, reason } = gameOverData;
  const isWinnerA = winner === 'A';
  const isWinnerB = winner === 'B';

  useEffect(() => {
    playVictory();
    // Confetti cannons from left and right
    const end = Date.now() + 3.5 * 1000;
    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: isWinnerA ? ['#00F0FF', '#0099FF', '#FFFFFF'] : ['#FF9900', '#FF6B00', '#FFFFFF']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: isWinnerA ? ['#00F0FF', '#0099FF', '#FFFFFF'] : ['#FF9900', '#FF6B00', '#FFFFFF']
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
        <div style={{ fontSize: '4.5rem', marginBottom: 6 }}>🏆</div>
        <h2
          style={{
            fontFamily: 'var(--font-title)',
            fontSize: '1.8rem',
            fontWeight: 900,
            color: isWinnerA ? 'var(--team-a-cyan)' : (isWinnerB ? 'var(--team-b-orange)' : '#FFF'),
            textTransform: 'uppercase'
          }}
        >
          {isWinnerA ? 'ĐỘI A - TIA CHỚP VÔ ĐỊCH!' : isWinnerB ? 'ĐỘI B - NGỌN LỬA VÔ ĐỊCH!' : 'TRẬN ĐẤU BẤT PHÂN THẮNG BẠI!'}
        </h2>

        <div style={{ margin: '14px 0', fontSize: '1.3rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
          TỶ SỐ CHUNG CUỘC: <span style={{ color: 'var(--team-a-cyan)' }}>{scoreA}</span> - <span style={{ color: 'var(--team-b-orange)' }}>{scoreB}</span>
        </div>

        {/* Booth Instruction Card per kehoach.docx */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 14,
            padding: '12px 14px',
            fontSize: '0.88rem',
            color: '#E2E8F0',
            marginBottom: 20
          }}
        >
          🎁 <strong>Thông báo gian hàng:</strong> Hãy tiến đến <strong>Trạm 2</strong> để nhận phần quà hấp dẫn!
          {matchCode && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
              Mã trận đấu: <code>{matchCode}</code>
            </div>
          )}
        </div>

        <button
          className="btn-tactile"
          style={{
            width: '100%',
            padding: '16px',
            background: 'var(--team-a-gradient)',
            color: '#0B132B',
            fontSize: '1.1rem',
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
