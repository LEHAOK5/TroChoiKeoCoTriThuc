import React from 'react';

export default function WinnerCelebrationBox({
  winnerTeam = 'A',
  winnerName = 'ĐỘI A - TIA CHỚP',
  isCompact = false
}) {
  const teamColor = winnerTeam === 'A' ? '#1A1AFF' : '#EA580C';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: isCompact ? '420px' : '560px',
        margin: '0 auto',
        background: 'linear-gradient(180deg, #101077 0%, #1A1AFF 50%, #0D0D99 100%)',
        border: '2.5px solid var(--comic-black)',
        borderRadius: 16,
        padding: isCompact ? '8px 10px' : '12px 14px',
        boxShadow: '0 5px 0 var(--comic-black)',
        position: 'relative',
        overflow: 'hidden',
        color: '#FFFFFF'
      }}
    >
      {/* KHÔNG GIAN BỤC VINH QUANG: 3 NHÂN VẬT CHIBI VÔ ĐỊCH */}
      <div
        style={{
          background: 'linear-gradient(180deg, #1E1B4B 0%, #0F172A 100%)',
          border: '2px solid #FACC15',
          borderRadius: 12,
          padding: isCompact ? '8px 6px' : '10px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Hào quang vàng kim xoay nhẹ */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(250, 204, 21, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* 3 NHÂN VẬT ĂN MỪNG TRÊN BỤC SỐ 1 */}
        <div
          style={{
            width: '100%',
            height: isCompact ? 104 : 122,
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: isCompact ? 8 : 16,
            paddingBottom: 4
          }}
        >
          {/* BỤC SỐ 1 DÁT VÀNG */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: isCompact ? '80px' : '100px',
              height: isCompact ? '26px' : '32px',
              background: 'linear-gradient(180deg, #FDE047 0%, #EAB308 60%, #CA8A04 100%)',
              border: '2px solid #000',
              borderRadius: '6px 6px 0 0',
              boxShadow: '0 -2px 6px rgba(250, 204, 21, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-title)',
              fontWeight: 900,
              fontSize: isCompact ? '0.9rem' : '1.1rem',
              color: '#713F12',
              zIndex: 1
            }}
          >
            #1 VÔ ĐỊCH
          </div>

          {/* NHÂN VẬT 1 (BÊN TRÁI): ĐEO HUY CHƯƠNG VÀNG */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'winnerJump 1.2s infinite ease-in-out',
              zIndex: 3
            }}
          >
            <div
              style={{
                fontSize: '0.58rem',
                fontWeight: 900,
                background: '#FEF08A',
                color: '#713F12',
                padding: '1px 5px',
                borderRadius: 4,
                border: '1px solid #000',
                marginBottom: 2,
                whiteSpace: 'nowrap'
              }}
            >
              🥇 Đỉnh chóp!
            </div>

            <svg viewBox="0 0 32 42" width="30" height="40">
              {/* Thân áo đội thắng */}
              <path d="M 6 18 C 5 18, 4 33, 7 40 C 11 42, 21 42, 25 40 C 28 33, 27 18, 26 18 Z" fill={teamColor} stroke="#000" strokeWidth="1.5" />
              {/* Dây đeo huy chương đỏ */}
              <path d="M 12 18 L 16 26 L 20 18" stroke="#DC2626" strokeWidth="1.5" fill="none" />
              {/* Huy chương vàng */}
              <circle cx="16" cy="27" r="3.2" fill="#FACC15" stroke="#713F12" strokeWidth="0.8" />
              <polygon points="16,25 16.5,26.5 18,26.5 16.8,27.3 17.2,28.7 16,27.8 14.8,28.7 15.2,27.3 14,26.5 15.5,26.5" fill="#713F12" />

              {/* Đầu & Băng đô */}
              <circle cx="16" cy="11" r="8" fill="#FED7AA" stroke="#000" strokeWidth="1.5" />
              <rect x="8" y="7.5" width="16" height="3" rx="1" fill="#FEF08A" stroke="#000" strokeWidth="0.8" />

              {/* Mắt cười tít */}
              <path d="M 11 12 Q 13 14 15 12" stroke="#000" strokeWidth="1.6" fill="none" />
              <path d="M 17 12 Q 19 14 21 12" stroke="#000" strokeWidth="1.6" fill="none" />
              {/* Miệng cười rạng rỡ */}
              <path d="M 12 15 Q 16 19 20 15" stroke="#000" strokeWidth="1.4" fill="#DC2626" />
            </svg>
          </div>

          {/* NHÂN VẬT 2 (Ở GIỮA TRÊN BỤC #1): NÂNG CÚP VÔ ĐỊCH */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'winnerJump 1.2s infinite ease-in-out 0.2s',
              zIndex: 3,
              marginBottom: isCompact ? 14 : 18
            }}
          >
            <div
              style={{
                fontSize: '0.62rem',
                fontWeight: 900,
                background: '#FEF08A',
                color: '#713F12',
                padding: '1px 6px',
                borderRadius: 4,
                border: '1px solid #000',
                marginBottom: 2,
                whiteSpace: 'nowrap'
              }}
            >
              🏆 Vô địch!
            </div>

            <svg viewBox="0 0 34 44" width="32" height="42">
              <path d="M 7 19 C 6 19, 5 34, 8 41 C 12 43, 22 43, 26 41 C 29 34, 28 19, 27 19 Z" fill={teamColor} stroke="#000" strokeWidth="1.5" />

              {/* Tay giơ cao chiếc cúp mini */}
              <path d="M 7 24 Q 3 14 7 8" fill="none" stroke="#000" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M 7 24 Q 3 14 7 8" fill="none" stroke={teamColor} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="7" cy="8" r="2.5" fill="#FED7AA" stroke="#000" strokeWidth="1" />
              {/* Cúp vàng mini trên tay */}
              <polygon points="4,2 10,2 9,6 5,6" fill="#FACC15" stroke="#000" strokeWidth="0.8" />
              <line x1="7" y1="6" x2="7" y2="8" stroke="#CA8A04" strokeWidth="1.2" />

              {/* Đầu & Băng đô */}
              <circle cx="17" cy="11.5" r="8.5" fill="#FED7AA" stroke="#000" strokeWidth="1.5" />
              <rect x="8.5" y="8" width="17" height="3" rx="1" fill="#FEF08A" stroke="#000" strokeWidth="0.8" />

              {/* Mắt sao lấp lánh */}
              <circle cx="13" cy="12" r="1.8" fill="#000" />
              <circle cx="13.5" cy="11.5" r="0.7" fill="#FFF" />
              <circle cx="21" cy="12" r="1.8" fill="#000" />
              <circle cx="21.5" cy="11.5" r="0.7" fill="#FFF" />

              {/* Miệng cười ngoác */}
              <ellipse cx="17" cy="16" rx="3.5" ry="2.2" fill="#EF4444" stroke="#000" strokeWidth="1" />
            </svg>
          </div>

          {/* NHÂN VẬT 3 (BÊN PHẢI): GIƠ TAY CHỮ V & TUNG HOA GIẤY */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'winnerJump 1.2s infinite ease-in-out 0.4s',
              zIndex: 3
            }}
          >
            <div
              style={{
                fontSize: '0.58rem',
                fontWeight: 900,
                background: '#FEF08A',
                color: '#713F12',
                padding: '1px 5px',
                borderRadius: 4,
                border: '1px solid #000',
                marginBottom: 2,
                whiteSpace: 'nowrap'
              }}
            >
              🎉 Quá đã!
            </div>

            <svg viewBox="0 0 32 42" width="30" height="40">
              <path d="M 6 18 C 5 18, 4 33, 7 40 C 11 42, 21 42, 25 40 C 28 33, 27 18, 26 18 Z" fill={teamColor} stroke="#000" strokeWidth="1.5" />

              {/* Tay giơ ngón tay chữ V */}
              <path d="M 25 24 Q 29 16 27 10" fill="none" stroke="#000" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M 25 24 Q 29 16 27 10" fill="none" stroke={teamColor} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="27" cy="10" r="2.5" fill="#FED7AA" stroke="#000" strokeWidth="1" />
              <line x1="26" y1="10" x2="25" y2="6" stroke="#FED7AA" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="28" y1="10" x2="29" y2="6" stroke="#FED7AA" strokeWidth="1.5" strokeLinecap="round" />

              {/* Đầu & Băng đô */}
              <circle cx="16" cy="11" r="8" fill="#FED7AA" stroke="#000" strokeWidth="1.5" />
              <rect x="8" y="7.5" width="16" height="3" rx="1" fill="#FEF08A" stroke="#000" strokeWidth="0.8" />

              <path d="M 11 12 Q 13 14 15 12" stroke="#000" strokeWidth="1.6" fill="none" />
              <path d="M 17 12 Q 19 14 21 12" stroke="#000" strokeWidth="1.6" fill="none" />
              <path d="M 12 15 Q 16 19 20 15" stroke="#000" strokeWidth="1.4" fill="#DC2626" />
            </svg>
          </div>
        </div>
      </div>

      {/* THẺ THÔNG ĐIỆP VINH DANH CHÚC MỪNG */}
      <div
        style={{
          marginTop: 8,
          background: '#FEF08A',
          border: '2px solid var(--comic-black)',
          borderRadius: 10,
          padding: '6px 8px',
          color: '#713F12',
          boxShadow: '0 2px 0 var(--comic-black)',
          fontSize: isCompact ? '0.74rem' : '0.82rem',
          lineHeight: 1.35
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <strong style={{ fontFamily: 'var(--font-title)', color: '#15803D', textTransform: 'uppercase', fontSize: '0.74rem' }}>
            👑 ĐẠI THẮNG VANG DỘI:
          </strong>
          <span style={{ fontSize: '0.7rem', fontWeight: 900, color: teamColor }}>
            {winnerName}
          </span>
        </div>
        <div>
          🎉 <em>"Chúc mừng bạn và đồng đội đã kéo phăng đối thủ, xuất sắc bước lên đỉnh vinh quang!"</em>
        </div>
        <div style={{ marginTop: 2, fontSize: '0.7rem', color: '#B45309', fontWeight: 700 }}>
          🎁 <strong>Đặc quyền vô địch:</strong> Hãy cùng tiến đến <strong>Trạm 2</strong> nhận ngay phần quà danh giá!
        </div>
      </div>
    </div>
  );
}
