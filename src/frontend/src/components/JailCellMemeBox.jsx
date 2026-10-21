import React, { useState, useEffect } from 'react';
import PoliceOfficerCharacter from './PoliceOfficerCharacter';

const FUNNY_CRIMES = [
  'Bấm chuông nhanh hơn tốc độ load của não!',
  'Tự tin chọn đáp án sai, kéo cả đội vào tù!',
  'Kéo co mà tưởng đang tập dưỡng sinh!',
  'Đoán mò không qua môn, bị thẩm phán tống giam!',
  'Dồn hết lực kéo nhưng kéo trúng dây đối thủ!'
];

export default function JailCellMemeBox({ loserTeam = 'B', loserName = 'ĐỘI B - NGỌN LỬA', isCompact = false }) {
  const [crimeIndex, setCrimeIndex] = useState(0);

  useEffect(() => {
    // Pick a random funny crime on mount
    setCrimeIndex(Math.floor(Math.random() * FUNNY_CRIMES.length));
  }, []);

  const teamBandColor = loserTeam === 'A' ? '#1A1AFF' : '#EA580C';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: isCompact ? '420px' : '560px',
        margin: '0 auto',
        background: '#0F172A',
        border: '3px solid var(--comic-black)',
        borderRadius: 18,
        padding: isCompact ? '10px 12px' : '14px 16px',
        boxShadow: '0 6px 0 var(--comic-black)',
        position: 'relative',
        overflow: 'hidden',
        color: '#FFFFFF'
      }}
    >
      {/* Còi cảnh sát nhấp nháy Đỏ - Xanh góc trên */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          zIndex: 5
        }}
      >
        <span
          style={{
            fontSize: isCompact ? '0.85rem' : '1rem',
            animation: 'policeSirenBlink 0.6s infinite alternate'
          }}
        >
          🚨
        </span>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 900,
            color: '#FEF08A',
            letterSpacing: 0.5,
            textTransform: 'uppercase'
          }}
        >
          PHÂN CẢNH THI HÀNH ÁN TÙ
        </span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 10,
          fontSize: '0.68rem',
          fontWeight: 800,
          background: '#EF4444',
          color: '#FFF',
          padding: '2px 8px',
          borderRadius: 6,
          border: '1.5px solid #000'
        }}
      >
        MÃ PHÒNG GIAM: #VHU-PRISON
      </div>

      {/* KHÔNG GIAN NHÀ TÙ: SONG SẮT & ĐỘI THUA & CHÚ CÔNG AN */}
      <div
        style={{
          marginTop: 26,
          background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
          border: '2px solid #334155',
          borderRadius: 14,
          padding: isCompact ? '10px 8px' : '14px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* KHU VỰC TRONG NHÀ TÙ (Phía sau song sắt) */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            height: isCompact ? 100 : 120,
            background: '#111827',
            borderRadius: 10,
            border: '2px solid #475569',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 12,
            paddingBottom: 4
          }}
        >
          {/* Hậu cảnh tường gạch nhà tù */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.15,
              backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)',
              backgroundSize: '16px 16px'
            }}
          />

          {/* NHÂN VẬT 1: ĐỘI THUA KHÓC RÒNG TRONG ÁO TÙ SỌC */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'tearsStream 1.2s infinite ease-in-out'
            }}
          >
            {/* Lời kêu oan */}
            <div
              style={{
                fontSize: '0.62rem',
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
              😭 Oan quá chú ơi!
            </div>

            <svg viewBox="0 0 36 46" width="36" height="46">
              {/* Thân áo tù sọc ngang đen trắng */}
              <path d="M 8 20 C 6 20, 5 36, 8 44 C 12 46, 24 46, 28 44 C 31 36, 30 20, 28 20 Z" fill="#FFFFFF" stroke="#000" strokeWidth="1.6" />
              <line x1="8" y1="25" x2="28" y2="25" stroke="#000" strokeWidth="2.5" />
              <line x1="7" y1="31" x2="29" y2="31" stroke="#000" strokeWidth="2.5" />
              <line x1="7" y1="37" x2="29" y2="37" stroke="#000" strokeWidth="2.5" />
              <line x1="8" y1="43" x2="28" y2="43" stroke="#000" strokeWidth="2.5" />

              {/* Đầu & Băng đô đội thua */}
              <circle cx="18" cy="12" r="9" fill="#FED7AA" stroke="#000" strokeWidth="1.6" />
              <rect x="9" y="8" width="18" height="3.5" rx="1" fill={teamBandColor} stroke="#000" strokeWidth="1" />

              {/* Mắt nhắm khóc & Nước mắt phun trào kiểu anime */}
              <path d="M 13 13 Q 15 11 17 13" stroke="#000" strokeWidth="1.8" fill="none" />
              <path d="M 19 13 Q 21 11 23 13" stroke="#000" strokeWidth="1.8" fill="none" />
              {/* Dòng nước mắt */}
              <path d="M 12 14 C 9 18, 10 24, 7 28" stroke="#38BDF8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M 24 14 C 27 18, 26 24, 29 28" stroke="#38BDF8" strokeWidth="2.5" fill="none" strokeLinecap="round" />

              {/* Miệng mếu */}
              <path d="M 15 17 Q 18 15 21 17" stroke="#000" strokeWidth="1.5" fill="none" />
            </svg>
          </div>

          {/* NHÂN VẬT 2: ĐỒNG ĐỘI ÔM ĐẦU KHÓC */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'tearsStream 1.2s infinite ease-in-out 0.3s'
            }}
          >
            <div
              style={{
                fontSize: '0.62rem',
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
              😫 Cứu con với!
            </div>

            <svg viewBox="0 0 36 46" width="36" height="46">
              <path d="M 8 20 C 6 20, 5 36, 8 44 C 12 46, 24 46, 28 44 C 31 36, 30 20, 28 20 Z" fill="#FFFFFF" stroke="#000" strokeWidth="1.6" />
              <line x1="8" y1="25" x2="28" y2="25" stroke="#000" strokeWidth="2.5" />
              <line x1="7" y1="31" x2="29" y2="31" stroke="#000" strokeWidth="2.5" />
              <line x1="7" y1="37" x2="29" y2="37" stroke="#000" strokeWidth="2.5" />
              <line x1="8" y1="43" x2="28" y2="43" stroke="#000" strokeWidth="2.5" />

              <circle cx="18" cy="12" r="9" fill="#FED7AA" stroke="#000" strokeWidth="1.6" />
              <rect x="9" y="8" width="18" height="3.5" rx="1" fill={teamBandColor} stroke="#000" strokeWidth="1" />

              <path d="M 13 14 L 16 12 L 13 15" stroke="#000" strokeWidth="1.8" fill="none" />
              <path d="M 23 14 L 20 12 L 23 15" stroke="#000" strokeWidth="1.8" fill="none" />
              <path d="M 11 14 C 8 20, 9 26, 6 30" stroke="#38BDF8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M 25 14 C 28 20, 27 26, 30 30" stroke="#38BDF8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <ellipse cx="18" cy="18" rx="3.5" ry="2.5" fill="#EF4444" stroke="#000" strokeWidth="1" />
            </svg>
          </div>

          {/* HÀNG SONG SẮT NHÀ TÙ ĐÈ LÊN NHÂN VẬT (Iron Bars) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              pointerEvents: 'none',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'stretch',
              padding: '0 4px'
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((bar) => (
              <div
                key={bar}
                style={{
                  width: '5px',
                  height: '100%',
                  background: 'linear-gradient(90deg, #64748B 0%, #CBD5E1 40%, #475569 100%)',
                  boxShadow: '1px 0 3px rgba(0,0,0,0.8)',
                  borderRadius: 2
                }}
              />
            ))}
          </div>

          {/* Thanh khóa song sắt ngang */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '40%',
              height: '6px',
              background: 'linear-gradient(180deg, #94A3B8 0%, #475569 100%)',
              zIndex: 11,
              borderTop: '1px solid #000',
              borderBottom: '1px solid #000'
            }}
          />
        </div>

        {/* CHÚ CÔNG AN CHIBI ĐỨNG GÁC BÊN NGOÀI SONG SẮT */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <PoliceOfficerCharacter isWhistling={true} width={isCompact ? 46 : 54} height={isCompact ? 60 : 70} />
          <div
            style={{
              marginTop: 2,
              fontSize: '0.62rem',
              fontWeight: 900,
              background: '#DC2626',
              color: '#FFF',
              padding: '1px 6px',
              borderRadius: 4,
              border: '1px solid #000',
              whiteSpace: 'nowrap'
            }}
          >
            👮‍♂️ ĐÃ BẮT TÙ
          </div>
        </div>
      </div>

      {/* BẢNG TỘI DANH SINH VIÊN HÀI HƯỚC */}
      <div
        style={{
          marginTop: 10,
          background: '#FEF08A',
          border: '2px solid var(--comic-black)',
          borderRadius: 12,
          padding: '8px 10px',
          color: '#713F12',
          boxShadow: '0 2px 0 var(--comic-black)',
          fontSize: isCompact ? '0.78rem' : '0.85rem',
          lineHeight: 1.35
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <strong style={{ fontFamily: 'var(--font-title)', color: '#991B1B', textTransform: 'uppercase' }}>
            ⚖️ PHÁN QUYẾT TỘI DANH:
          </strong>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: teamBandColor }}>
            {loserName}
          </span>
        </div>
        <div>
          📜 <em>"{FUNNY_CRIMES[crimeIndex]}"</em>
        </div>
        <div style={{ marginTop: 4, fontSize: '0.74rem', color: '#B45309', fontWeight: 700 }}>
          🔒 <strong>Hình phạt:</strong> Áp giải đến Trạm 2 rót trà đá & xin chữ ký chúc mừng Đội Vô Địch!
        </div>
      </div>
    </div>
  );
}
