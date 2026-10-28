import React, { useState, useEffect } from 'react';

export default function ExitPage({ summary, onNewPlayer }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const [closeAttempted, setCloseAttempted] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCloseTab = () => {
    setCloseAttempted(true);
    try {
      window.close();
    } catch (e) {
      console.log('Browser blocked window.close()', e);
    }
  };

  const isWinner = summary?.isWinner;
  const teamName = summary?.playerTeam === 'A' ? '⚡ ĐỘI A - TIA CHỚP' : '🔥 ĐỘI B - NGỌN LỬA';

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        backgroundColor: '#1A1AFF',
        background: '#1A1AFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '12px' : '24px',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#FFFFFF',
          border: '3.5px solid var(--comic-black)',
          borderRadius: isMobile ? 18 : 24,
          boxShadow: isMobile ? '0 6px 0 var(--comic-black)' : '0 10px 0 var(--comic-black)',
          padding: isMobile ? '18px 14px' : '26px 22px',
          textAlign: 'center',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        {/* Biểu tượng Huy chương & Vỗ tay */}
        <div style={{ fontSize: isMobile ? '3.2rem' : '4rem', lineHeight: 1, marginBottom: 6 }}>
          🎖️
        </div>

        {/* Tiêu đề */}
        <h1
          style={{
            fontFamily: 'var(--font-title)',
            fontSize: isMobile ? '1.35rem' : '1.75rem',
            fontWeight: 900,
            color: '#1A1AFF',
            textTransform: 'uppercase',
            textShadow: '1.5px 1.5px 0 var(--comic-black)',
            margin: '0 0 6px 0',
            lineHeight: 1.2
          }}
        >
          HOÀN THÀNH PHẦN THI!
        </h1>

        <p
          style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'var(--text-muted)',
            fontWeight: 700,
            margin: '0 0 14px 0'
          }}
        >
          Cảm ơn bạn đã tham gia Đấu trường Kéo Co Tri Thức!
        </p>

        {/* Khung Thẻ Minh Chứng Sinh Viên (Proof of Participation) */}
        <div
          style={{
            background: '#F8FAFC',
            border: '2.5px solid var(--comic-black)',
            borderRadius: 16,
            padding: isMobile ? '12px 14px' : '16px 18px',
            textAlign: 'left',
            boxShadow: '0 4px 0 var(--comic-black)',
            marginBottom: 14
          }}
        >
          {/* Tiêu đề Phiếu xác nhận kết quả */}
          <div
            style={{
              fontFamily: 'var(--font-title)',
              fontSize: isMobile ? '0.86rem' : '0.94rem',
              fontWeight: 900,
              color: '#1A1AFF',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              borderBottom: '2px dashed #CBD5E1',
              paddingBottom: 8,
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <span>📜</span>
            <span>PHIẾU XÁC NHẬN KẾT QUẢ</span>
          </div>

          <div style={{ display: 'grid', gap: isMobile ? '8px' : '10px', fontSize: isMobile ? '0.82rem' : '0.88rem' }}>
            {/* Dòng 1: Thí sinh */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>👤 Thí sinh:</span>
              <span style={{ fontWeight: 800, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span>{summary?.playerName || 'Sinh viên VHU'}</span>
                {summary?.studentId && (
                  <span
                    style={{
                      background: '#E2E8F0',
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#475569'
                    }}
                  >
                    {summary.studentId}
                  </span>
                )}
              </span>
            </div>

            {/* Dòng 2: Đội thi đấu */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>⚔️ Đội thi đấu:</span>
              <span
                style={{
                  fontWeight: 900,
                  fontFamily: 'var(--font-title)',
                  fontSize: '0.78rem',
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: summary?.playerTeam === 'A' ? '#E6E6FF' : '#FFEDD5',
                  color: summary?.playerTeam === 'A' ? '#1A1AFF' : '#EA580C',
                  border: '1.5px solid var(--comic-black)',
                  boxShadow: '0 1.5px 0 var(--comic-black)'
                }}
              >
                {teamName}
              </span>
            </div>

            {/* Dòng 3: Kết quả trận */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>🏅 Kết quả trận:</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontWeight: 900,
                    fontFamily: 'var(--font-title)',
                    fontSize: '0.78rem',
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: isWinner ? '#DCFCE7' : '#FEF3C7',
                    color: isWinner ? '#15803D' : '#B45309',
                    border: '1.5px solid var(--comic-black)',
                    boxShadow: '0 1.5px 0 var(--comic-black)'
                  }}
                >
                  {isWinner ? '🏆 CHIẾN THẮNG' : '👏 HOÀN THÀNH'}
                </span>
                <span style={{ color: '#0F172A', fontWeight: 800, fontSize: '0.8rem' }}>
                  ({summary?.scoreA ?? 0} - {summary?.scoreB ?? 0})
                </span>
              </div>
            </div>

            {/* Dòng 4: Mã ván đấu */}
            {summary?.matchCode && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>🔖 Mã ván đấu:</span>
                <code
                  style={{
                    background: '#FEF08A',
                    padding: '2px 8px',
                    borderRadius: 6,
                    border: '1.5px solid var(--comic-black)',
                    boxShadow: '0 1.5px 0 var(--comic-black)',
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    color: '#713F12'
                  }}
                >
                  {summary.matchCode}
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Khung nhắc nhở chụp màn hình & đến Trạm 2 */}
        <div
          style={{
            background: '#FEF9C3',
            border: '2px dashed #CA8A04',
            borderRadius: 12,
            padding: isMobile ? '8px 10px' : '10px 12px',
            fontSize: isMobile ? '0.78rem' : '0.86rem',
            color: '#854D0E',
            fontWeight: 700,
            lineHeight: 1.35,
            marginBottom: 16,
            textAlign: 'center'
          }}
        >
          📸 <strong>Nhắc nhở:</strong> Bạn hãy chụp ảnh màn hình này và cùng đồng đội tiến đến <strong>Trạm 2</strong> để nhận quà kỷ niệm nhé!
        </div>

        {/* Cụm nút hành động */}
        <div style={{ display: 'grid', gap: isMobile ? 8 : 10 }}>
          {/* Nút 1: Đóng tab trình duyệt */}
          <button
            className="btn-tactile"
            style={{
              width: '100%',
              padding: isMobile ? '11px' : '13px',
              background: 'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)',
              color: '#FFFFFF',
              fontSize: isMobile ? '0.92rem' : '1.02rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
            onClick={handleCloseTab}
            id="close-tab-btn"
          >
            <span>🛑</span>
            <span>ĐÓNG TAB TRÌNH DUYỆT</span>
          </button>

          {/* Hướng dẫn fallback nếu trình duyệt chặn window.close() */}
          {closeAttempted && (
            <div
              style={{
                fontSize: '0.74rem',
                color: '#DC2626',
                fontWeight: 700,
                background: '#FEE2E2',
                padding: '6px 8px',
                borderRadius: 8,
                border: '1px solid #F87171'
              }}
            >
              ⚠️ Trình duyệt trên máy đã chặn tự động tắt tab. Bạn hãy bấm vào nút tắt tab trên điện thoại của mình nhé!
            </div>
          )}

          {/* Nút 2: Truyền máy cho bạn khác chơi lượt mới */}
          <button
            className="btn-tactile"
            style={{
              width: '100%',
              padding: isMobile ? '10px' : '12px',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: isMobile ? '0.84rem' : '0.92rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
            onClick={onNewPlayer}
            id="new-player-btn"
          >
            <span>👥</span>
            <span>NHƯỜNG LƯỢT / ĐĂNG KÝ BẠN MỚI</span>
          </button>
        </div>
      </div>
    </div>
  );
}
