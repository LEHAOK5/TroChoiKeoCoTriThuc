import React from 'react';

export default function RefereeCharacter({ ropeOffset = 0, lastResult = null, isBuzzed = false, winner = null }) {
  // Mắt trọng tài dõi theo độ lệch dây (-10 đến 10)
  const eyeOffset = Math.max(-2.5, Math.min(2.5, ropeOffset * 0.28));

  // Thổi còi khi có chuông hoặc có điểm
  const isWhistling = Boolean(lastResult?.isCorrect || isBuzzed);

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: '8px',
        transform: 'translateX(-50%)',
        zIndex: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none'
      }}
      title="Trọng tài điều khiển trận đấu"
    >
      {/* Khung thoại thông báo của trọng tài */}
      {isWhistling && (
        <div
          style={{
            position: 'absolute',
            top: -24,
            background: '#FEF08A',
            border: '2px solid #0F172A',
            borderRadius: 999,
            padding: '2px 9px',
            fontSize: '11px',
            fontWeight: 900,
            fontFamily: 'var(--font-title)',
            color: '#713F12',
            boxShadow: '0 2px 0 #0F172A',
            whiteSpace: 'nowrap',
            animation: 'bounceIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: 20
          }}
        >
          {isBuzzed ? '🎺 CÓ CHUÔNG!' : '🎺 TUÝT TUÝT! +1Đ'}
        </div>
      )}

      {/* SVG TRỌNG TÀI CHIBI SIÊU DỄ THƯƠNG */}
      <svg
        viewBox="0 0 56 72"
        width="54"
        height="68"
        style={{
          filter: 'drop-shadow(0 3px 0 rgba(15, 23, 42, 0.25))',
          animation: isWhistling ? 'refereeJump 0.4s infinite alternate ease-in-out' : 'refereeIdle 2.2s infinite ease-in-out'
        }}
      >
        {/* Bóng chân */}
        <ellipse cx="28" cy="68" rx="15" ry="3.5" fill="rgba(15, 23, 42, 0.25)" />

        {/* Chân trọng tài chibi */}
        <line x1="22" y1="48" x2="20" y2="62" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
        <line x1="34" y1="48" x2="36" y2="62" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
        {/* Giày da đen */}
        <rect x="15" y="60" width="11" height="6" rx="2.5" fill="#0F172A" stroke="#0F172A" strokeWidth="1" />
        <rect x="30" y="60" width="11" height="6" rx="2.5" fill="#0F172A" stroke="#0F172A" strokeWidth="1" />
        <circle cx="24" cy="62" r="1.5" fill="#FFFFFF" />
        <circle cx="32" cy="62" r="1.5" fill="#FFFFFF" />

        {/* Thân áo Chibi sọc trắng đen */}
        <path
          d="M 17 30 C 16 30, 15 44, 18 48 C 23 50, 33 50, 38 48 C 41 44, 40 30, 39 30 Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="2.4"
        />
        <line x1="22" y1="30" x2="22" y2="49" stroke="#0F172A" strokeWidth="2.5" />
        <line x1="28" y1="30" x2="28" y2="49" stroke="#0F172A" strokeWidth="2.5" />
        <line x1="34" y1="30" x2="34" y2="49" stroke="#0F172A" strokeWidth="2.5" />

        {/* Dây đeo còi đỏ */}
        <path d="M 24 30 Q 28 36 32 30" stroke="#EF4444" strokeWidth="1.5" fill="none" />
        <rect x="26" y="35" width="5" height="4" rx="1.2" fill="#FACC15" stroke="#0F172A" strokeWidth="1" />

        {/* Tay phải cầm cờ đỏ */}
        <path
          d={isWhistling ? "M 38 34 Q 48 22 46 16" : "M 38 34 Q 46 40 42 46"}
          fill="none"
          stroke="#0F172A"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d={isWhistling ? "M 38 34 Q 48 22 46 16" : "M 38 34 Q 46 40 42 46"}
          fill="none"
          stroke="#FED7AA"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx={isWhistling ? "46" : "42"} cy={isWhistling ? "16" : "46"} r="3.5" fill="#FED7AA" stroke="#0F172A" strokeWidth="1.5" />
        {isWhistling && (
          <g>
            <line x1="46" y1="16" x2="50" y2="4" stroke="#713F12" strokeWidth="2" strokeLinecap="round" />
            <polygon points="50,4 56,8 50,12" fill="#EF4444" stroke="#0F172A" strokeWidth="1.2" />
          </g>
        )}

        {/* Tay trái chống hông */}
        <path d="M 18 34 Q 10 38 16 44" fill="none" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
        <path d="M 18 34 Q 10 38 16 44" fill="none" stroke="#FED7AA" strokeWidth="3.5" strokeLinecap="round" />

        {/* Đầu tròn Chibi dễ thương */}
        <circle cx="28" cy="19" r="13.5" fill="#FED7AA" stroke="#0F172A" strokeWidth="2.4" />

        {/* Mũ lưỡi trai đen */}
        <path d="M 16 16 Q 28 10 40 16 L 39 19 Q 28 14 17 19 Z" fill="#0F172A" stroke="#0F172A" strokeWidth="1.5" />
        <ellipse cx="28" cy="13" rx="10.5" ry="4.5" fill="#0F172A" />
        <path d="M 28 15 Q 39 14 42 18 Q 35 20 28 19 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />

        {/* Mắt to tròn dõi theo dây thừng */}
        <ellipse cx="24" cy="20" rx="3" ry="3.8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.4" />
        <circle cx={24 + eyeOffset} cy="20" r="1.8" fill="#0F172A" />
        <circle cx={24 + eyeOffset + 0.6} cy="19.2" r="0.7" fill="#FFFFFF" />

        <ellipse cx="32" cy="20" rx="3" ry="3.8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.4" />
        <circle cx={32 + eyeOffset} cy="20" r="1.8" fill="#0F172A" />
        <circle cx={32 + eyeOffset + 0.6} cy="19.2" r="0.7" fill="#FFFFFF" />

        {/* Má hồng phúng phính */}
        <ellipse cx="19" cy="24" rx="2.5" ry="1.4" fill="rgba(244, 63, 94, 0.4)" />
        <ellipse cx="37" cy="24" rx="2.5" ry="1.4" fill="rgba(244, 63, 94, 0.4)" />

        {/* Còi ngậm ở miệng khi thổi */}
        {isWhistling ? (
          <g>
            <rect x="25" y="23" width="7" height="4" rx="1.5" fill="#FACC15" stroke="#0F172A" strokeWidth="1" />
            <circle cx="32" cy="25" r="1.5" fill="#EAB308" />
            <line x1="34" y1="23" x2="38" y2="21" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="35" y1="26" x2="40" y2="26" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        ) : (
          <path d="M 25 25 Q 28 28 31 25" fill="none" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
}
