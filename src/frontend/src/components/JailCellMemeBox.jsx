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
        background: 'linear-gradient(180deg, #0A0A58 0%, #151590 55%, #0B0B50 100%)',
        border: '2.5px solid var(--comic-black)',
        borderRadius: 16,
        padding: isCompact ? '8px 10px' : '12px 14px',
        boxShadow: '0 5px 0 var(--comic-black)',
        position: 'relative',
        overflow: 'hidden',
        color: '#FFFFFF'
      }}
    >
      {/* KHÔNG GIAN NHÀ TÙ: SONG SẮT & BỘ 3 NHÂN VẬT ĐỘI THUA & CHÚ CÔNG AN */}
      <div
        style={{
          background: 'linear-gradient(180deg, #101046 0%, #080826 100%)',
          border: '2px solid #334155',
          borderRadius: 12,
          padding: isCompact ? '8px 6px' : '10px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* KHU VỰC TRONG NHÀ TÙ (Phía sau song sắt) */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            height: isCompact ? 104 : 122,
            background: '#090A1A',
            borderRadius: 8,
            border: '2px solid #4338CA',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            gap: 2,
            paddingBottom: 2
          }}
        >
          {/* Hậu cảnh tường gạch nhà tù ánh xanh */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.15,
              backgroundImage: 'linear-gradient(#6366F1 1px, transparent 1px), linear-gradient(90deg, #6366F1 1px, transparent 1px)',
              backgroundSize: '14px 14px'
            }}
          />

          {/* NHÂN VẬT 1: KHÓC RÒNG TRONG ÁO TÙ SỌC */}
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'tearsStream 1.2s infinite ease-in-out'
            }}
          >
            {/* Lời kêu oan - zIndex 15 hiển thị trước song sắt */}
            <div
              style={{
                position: 'relative',
                zIndex: 15,
                fontSize: '0.58rem',
                fontWeight: 900,
                background: '#FEF08A',
                color: '#713F12',
                padding: '1px 4px',
                borderRadius: 4,
                border: '1px solid #000',
                marginBottom: 2,
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 0 #000'
              }}
            >
              😭 Oan quá!
            </div>

            <svg viewBox="0 0 32 42" width="30" height="40">
              {/* Thân áo tù sọc ngang đen trắng */}
              <path d="M 6 18 C 5 18, 4 33, 7 40 C 11 42, 21 42, 25 40 C 28 33, 27 18, 26 18 Z" fill="#FFFFFF" stroke="#000" strokeWidth="1.5" />
              <line x1="6" y1="23" x2="26" y2="23" stroke="#000" strokeWidth="2.2" />
              <line x1="5" y1="28" x2="27" y2="28" stroke="#000" strokeWidth="2.2" />
              <line x1="5" y1="34" x2="27" y2="34" stroke="#000" strokeWidth="2.2" />

              {/* Đầu & Băng đô đội thua */}
              <circle cx="16" cy="11" r="8" fill="#FED7AA" stroke="#000" strokeWidth="1.5" />
              <rect x="8" y="7.5" width="16" height="3" rx="1" fill={teamBandColor} stroke="#000" strokeWidth="0.8" />

              {/* Mắt nhắm khóc & Nước mắt phun trào kiểu anime */}
              <path d="M 11 12 Q 13 10 15 12" stroke="#000" strokeWidth="1.6" fill="none" />
              <path d="M 17 12 Q 19 10 21 12" stroke="#000" strokeWidth="1.6" fill="none" />
              <path d="M 10 13 C 7 17, 8 22, 5 26" stroke="#38BDF8" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              <path d="M 22 13 C 25 17, 24 22, 27 26" stroke="#38BDF8" strokeWidth="2.2" fill="none" strokeLinecap="round" />

              {/* Miệng mếu */}
              <path d="M 13 15 Q 16 13 19 15" stroke="#000" strokeWidth="1.4" fill="none" />
            </svg>
          </div>

          {/* NHÂN VẬT 2: CHOÁNG VÁNG MẮT XOÁY ỐC (MỚI BỔ SUNG) */}
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'tearsStream 1.2s infinite ease-in-out 0.2s'
            }}
          >
            {/* Lời kêu oan - zIndex 15 hiển thị trước song sắt */}
            <div
              style={{
                position: 'relative',
                zIndex: 15,
                fontSize: '0.58rem',
                fontWeight: 900,
                background: '#FEF08A',
                color: '#713F12',
                padding: '1px 4px',
                borderRadius: 4,
                border: '1px solid #000',
                marginBottom: 2,
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 0 #000'
              }}
            >
              🥺 Biết thế!
            </div>

            <svg viewBox="0 0 32 42" width="30" height="40">
              <path d="M 6 18 C 5 18, 4 33, 7 40 C 11 42, 21 42, 25 40 C 28 33, 27 18, 26 18 Z" fill="#FFFFFF" stroke="#000" strokeWidth="1.5" />
              <line x1="6" y1="23" x2="26" y2="23" stroke="#000" strokeWidth="2.2" />
              <line x1="5" y1="28" x2="27" y2="28" stroke="#000" strokeWidth="2.2" />
              <line x1="5" y1="34" x2="27" y2="34" stroke="#000" strokeWidth="2.2" />

              <circle cx="16" cy="11" r="8" fill="#FED7AA" stroke="#000" strokeWidth="1.5" />
              <rect x="8" y="7.5" width="16" height="3" rx="1" fill={teamBandColor} stroke="#000" strokeWidth="0.8" />

              {/* Băng cá nhân chữ X trên trán */}
              <line x1="14" y1="5.5" x2="18" y2="7.5" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="18" y1="5.5" x2="14" y2="7.5" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />

              {/* Mắt xoáy ốc choáng váng kiểu comic */}
              <circle cx="12" cy="12" r="2.2" fill="none" stroke="#000" strokeWidth="1.3" />
              <circle cx="12" cy="12" r="0.8" fill="#000" />
              <circle cx="20" cy="12" r="2.2" fill="none" stroke="#000" strokeWidth="1.3" />
              <circle cx="20" cy="12" r="0.8" fill="#000" />

              {/* Miệng lượn sóng ngơ ngác */}
              <path d="M 13 16 Q 14.5 15 16 16.5 Q 17.5 18 19 16" stroke="#000" strokeWidth="1.3" fill="none" />
            </svg>
          </div>

          {/* NHÂN VẬT 3: ÔM ĐẦU KÊU CỨU */}
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'tearsStream 1.2s infinite ease-in-out 0.4s'
            }}
          >
            {/* Lời kêu oan - zIndex 15 hiển thị trước song sắt */}
            <div
              style={{
                position: 'relative',
                zIndex: 15,
                fontSize: '0.58rem',
                fontWeight: 900,
                background: '#FEF08A',
                color: '#713F12',
                padding: '1px 4px',
                borderRadius: 4,
                border: '1px solid #000',
                marginBottom: 2,
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 0 #000'
              }}
            >
              😫 Cứu với!
            </div>

            <svg viewBox="0 0 32 42" width="30" height="40">
              <path d="M 6 18 C 5 18, 4 33, 7 40 C 11 42, 21 42, 25 40 C 28 33, 27 18, 26 18 Z" fill="#FFFFFF" stroke="#000" strokeWidth="1.5" />
              <line x1="6" y1="23" x2="26" y2="23" stroke="#000" strokeWidth="2.2" />
              <line x1="5" y1="28" x2="27" y2="28" stroke="#000" strokeWidth="2.2" />
              <line x1="5" y1="34" x2="27" y2="34" stroke="#000" strokeWidth="2.2" />

              <circle cx="16" cy="11" r="8" fill="#FED7AA" stroke="#000" strokeWidth="1.5" />
              <rect x="8" y="7.5" width="16" height="3" rx="1" fill={teamBandColor} stroke="#000" strokeWidth="0.8" />

              {/* Mắt nhắm chặt & Miệng há to kêu cứu */}
              <path d="M 11 12 L 14 11 L 11 13" stroke="#000" strokeWidth="1.6" fill="none" />
              <path d="M 21 12 L 18 11 L 21 13" stroke="#000" strokeWidth="1.6" fill="none" />
              <ellipse cx="16" cy="15.5" rx="3.2" ry="2.2" fill="#DC2626" stroke="#000" strokeWidth="1" />
            </svg>
          </div>

          {/* HÀNG SONG SẮT NHÀ TÙ ĐÈ LÊN NHÂN VẬT (Iron Bars) - zIndex: 10 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              pointerEvents: 'none',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'stretch',
              padding: '0 2px'
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
              <div
                key={bar}
                style={{
                  width: '4px',
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366F1 0%, #E0E7FF 40%, #4338CA 100%)',
                  boxShadow: '1px 0 2px rgba(0,0,0,0.8)',
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
              top: '46%',
              height: '5px',
              background: 'linear-gradient(180deg, #C7D2FE 0%, #4338CA 100%)',
              zIndex: 11,
              borderTop: '1px solid #000',
              borderBottom: '1px solid #000'
            }}
          />
        </div>

        {/* CHÚ CÔNG AN CHIBI ĐỨNG GÁC BÊN NGOÀI SONG SẮT */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <PoliceOfficerCharacter isWhistling={true} width={isCompact ? 44 : 52} height={isCompact ? 58 : 68} />
          <div
            style={{
              marginTop: 2,
              fontSize: '0.6rem',
              fontWeight: 900,
              background: '#DC2626',
              color: '#FFF',
              padding: '1px 5px',
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
          <strong style={{ fontFamily: 'var(--font-title)', color: '#991B1B', textTransform: 'uppercase', fontSize: '0.72rem' }}>
            ⚖️ PHÁN QUYẾT TỘI DANH:
          </strong>
          <span style={{ fontSize: '0.68rem', fontWeight: 900, color: teamBandColor }}>
            {loserName}
          </span>
        </div>
        <div>
          📜 <em>"{FUNNY_CRIMES[crimeIndex]}"</em>
        </div>
        <div style={{ marginTop: 2, fontSize: '0.7rem', color: '#B45309', fontWeight: 700 }}>
          🔒 <strong>Hình phạt:</strong> Áp giải đến Trạm 2 rót trà đá & xin chữ ký chúc mừng Đội Vô Địch!
        </div>
      </div>
    </div>
  );
}
