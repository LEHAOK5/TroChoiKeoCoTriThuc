import React from 'react';

export default function LobbyPage({
  player,
  roomState,
  onSwitchTeam,
  onToggleReady,
  onAddBot,
  onLogout
}) {
  const teamA = roomState?.teamA || [];
  const teamB = roomState?.teamB || [];
  const mode = roomState?.mode || '1vs1';
  const maxPerTeam = roomState?.maxPerTeam || 1;
  const currentTeam = player?.team || 'A';
  const isMyReady = player?.isReady || false;
  const currentRoom = roomState?.roomCode || 'KCO1';

  const readyA = teamA.length >= maxPerTeam && teamA.every(p => p.isReady);
  const readyB = teamB.length >= maxPerTeam && teamB.every(p => p.isReady);
  const allReady = readyA && readyB;

  const totalPlayers = teamA.length + teamB.length;
  const targetTotal = maxPerTeam * 2;
  const readyCount = teamA.filter(p => p.isReady).length + teamB.filter(p => p.isReady).length;

  const hasOpponent = (currentTeam === 'A' ? teamB.length : teamA.length) > 0;

  return (
    <div style={{ maxWidth: 740, margin: '14px auto', padding: '0 16px', width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Bar: User Greeting + Room Info + Logout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: 'var(--glass-surface)', border: 'var(--glass-border)', padding: '6px 14px', borderRadius: 20, fontSize: '0.88rem' }}>
            👋 <strong>{player?.name}</strong> <span style={{ color: 'var(--text-muted)' }}>({player?.studentId})</span>
          </div>
          <button
            onClick={onLogout}
            id="lobby-logout-btn"
            style={{
              background: 'rgba(255, 23, 68, 0.15)',
              border: '1px solid rgba(255, 23, 68, 0.5)',
              color: '#FF5252',
              padding: '6px 14px',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 800
            }}
            title="Rời phòng đấu để đổi thông tin hoặc vào phòng khác"
          >
            🚪 Rời phòng
          </button>
        </div>

        {/* Room & Mode Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            background: 'rgba(255, 214, 0, 0.15)',
            border: '1.5px solid var(--color-steal)',
            color: 'var(--color-steal)',
            padding: '6px 14px',
            borderRadius: 14,
            fontFamily: 'var(--font-title)',
            fontWeight: 900,
            fontSize: '1.1rem',
            letterSpacing: 2
          }}>
            PHÒNG #{currentRoom}
          </span>
          <span style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#FFF',
            padding: '6px 12px',
            borderRadius: 14,
            fontSize: '0.82rem',
            fontWeight: 800
          }}>
            Chế độ: {mode} ({maxPerTeam} vs {maxPerTeam})
          </span>
        </div>
      </div>

      {/* Progress Notice */}
      <div style={{
        background: allReady ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.04)',
        border: allReady ? '1px solid #00E676' : 'var(--glass-border)',
        borderRadius: 14,
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.86rem'
      }}>
        <span>
          👥 Đã vào phòng: <strong>{totalPlayers}/{targetTotal}</strong> người • Sẵn sàng: <strong style={{ color: 'var(--color-steal)' }}>{readyCount}/{targetTotal}</strong>
        </span>
        <span style={{ color: allReady ? '#00E676' : 'var(--text-muted)', fontWeight: 700 }}>
          {allReady ? '🎉 TẤT CẢ ĐÃ SẴN SÀNG! ĐANG BẮT ĐẦU...' : 'Đang đợi đủ người và sẵn sàng...'}
        </span>
      </div>

      {/* Team Selection Confrontation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Team A Card */}
        <div
          style={{
            background: currentTeam === 'A' ? 'rgba(0, 240, 255, 0.12)' : 'var(--glass-surface)',
            border: currentTeam === 'A' ? '2px solid var(--team-a-cyan)' : 'var(--glass-border)',
            boxShadow: currentTeam === 'A' ? '0 0 20px var(--team-a-glow)' : 'none',
            borderRadius: 18,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '1.8rem' }}>⚡</span>
              <span style={{
                background: teamA.length >= maxPerTeam ? 'rgba(0, 230, 118, 0.2)' : 'rgba(0, 240, 255, 0.2)',
                color: teamA.length >= maxPerTeam ? '#00E676' : 'var(--team-a-cyan)',
                padding: '3px 10px',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 800
              }}>
                {teamA.length} / {maxPerTeam} thành viên
              </span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-title)', color: 'var(--team-a-cyan)', fontSize: '1.15rem', fontWeight: 800 }}>
              ĐỘI A - TIA CHỚP
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Đội hình công nghệ và phản xạ siêu tốc
            </p>
          </div>

          <button
            className="btn-tactile"
            disabled={currentTeam === 'A' || teamA.length >= maxPerTeam}
            style={{
              padding: '10px',
              background: currentTeam === 'A' ? 'var(--team-a-gradient)' : (teamA.length >= maxPerTeam ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.1)'),
              color: currentTeam === 'A' ? '#0B132B' : (teamA.length >= maxPerTeam ? '#666' : '#FFF'),
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: currentTeam === 'A' || teamA.length >= maxPerTeam ? 'default' : 'pointer'
            }}
            onClick={() => onSwitchTeam('A')}
          >
            {currentTeam === 'A' ? 'BẠN ĐANG Ở ĐỘI A ✅' : (teamA.length >= maxPerTeam ? 'ĐỘI A ĐÃ ĐỦ NGƯỜI' : 'CHUYỂN SANG ĐỘI A')}
          </button>
        </div>

        {/* Team B Card */}
        <div
          style={{
            background: currentTeam === 'B' ? 'rgba(255, 107, 0, 0.12)' : 'var(--glass-surface)',
            border: currentTeam === 'B' ? '2px solid var(--team-b-orange)' : 'var(--glass-border)',
            boxShadow: currentTeam === 'B' ? '0 0 20px var(--team-b-glow)' : 'none',
            borderRadius: 18,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '1.8rem' }}>🔥</span>
              <span style={{
                background: teamB.length >= maxPerTeam ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 107, 0, 0.2)',
                color: teamB.length >= maxPerTeam ? '#00E676' : 'var(--team-b-orange)',
                padding: '3px 10px',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 800
              }}>
                {teamB.length} / {maxPerTeam} thành viên
              </span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-title)', color: 'var(--team-b-orange)', fontSize: '1.15rem', fontWeight: 800 }}>
              ĐỘI B - NGỌN LỬA
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Ý chí bền bỉ và bản lĩnh tranh biện
            </p>
          </div>

          <button
            className="btn-tactile"
            disabled={currentTeam === 'B' || teamB.length >= maxPerTeam}
            style={{
              padding: '10px',
              background: currentTeam === 'B' ? 'var(--team-b-gradient)' : (teamB.length >= maxPerTeam ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.1)'),
              color: currentTeam === 'B' ? '#0B132B' : (teamB.length >= maxPerTeam ? '#666' : '#FFF'),
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: currentTeam === 'B' || teamB.length >= maxPerTeam ? 'default' : 'pointer'
            }}
            onClick={() => onSwitchTeam('B')}
          >
            {currentTeam === 'B' ? 'BẠN ĐANG Ở ĐỘI B ✅' : (teamB.length >= maxPerTeam ? 'ĐỘI B ĐÃ ĐỦ NGƯỜI' : 'CHUYỂN SANG ĐỘI B')}
          </button>
        </div>
      </div>

      {/* Rosters View - Real-time Player List for all teammates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Team A Members */}
        <div style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: 14, padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
            <strong style={{ color: 'var(--team-a-cyan)' }}>THÀNH VIÊN ĐỘI A ({teamA.length}/{maxPerTeam})</strong>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: readyA ? '#00E676' : '#FFAB00' }}>
              {readyA ? '✅ SẴN SÀNG' : '⏳ CHỜ'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {teamA.map(p => (
              <div key={p.socketId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: 8, fontSize: '0.82rem' }}>
                <span>
                  👤 <strong>{p.name}</strong> {p.socketId === player?.socketId ? <span style={{ color: 'var(--team-a-cyan)' }}>(Bạn)</span> : ''}
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginLeft: 4 }}>({p.studentId})</span>
                </span>
                <span style={{ color: p.isReady ? '#00E676' : '#FFAB00', fontWeight: 800, fontSize: '0.75rem' }}>
                  {p.isReady ? '✅ SẴN SÀNG' : '⏳ CHỜ'}
                </span>
              </div>
            ))}
            {teamA.length === 0 && (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontStyle: 'italic', padding: '6px 0' }}>
                Chưa có ai vào Đội A
              </div>
            )}
          </div>
        </div>

        {/* Team B Members */}
        <div style={{ background: 'rgba(255, 107, 0, 0.05)', border: '1px solid rgba(255, 107, 0, 0.2)', borderRadius: 14, padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
            <strong style={{ color: 'var(--team-b-orange)' }}>THÀNH VIÊN ĐỘI B ({teamB.length}/{maxPerTeam})</strong>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: readyB ? '#00E676' : '#FFAB00' }}>
              {readyB ? '✅ SẴN SÀNG' : '⏳ CHỜ'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {teamB.map(p => (
              <div key={p.socketId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: 8, fontSize: '0.82rem' }}>
                <span>
                  👤 <strong>{p.name}</strong> {p.socketId === player?.socketId ? <span style={{ color: 'var(--team-b-orange)' }}>(Bạn)</span> : ''}
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginLeft: 4 }}>({p.studentId})</span>
                </span>
                <span style={{ color: p.isReady ? '#00E676' : '#FFAB00', fontWeight: 800, fontSize: '0.75rem' }}>
                  {p.isReady ? '✅ SẴN SÀNG' : '⏳ CHỜ'}
                </span>
              </div>
            ))}
            {teamB.length === 0 && (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontStyle: 'italic', padding: '6px 0' }}>
                Chưa có ai vào Đội B
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Solo practice / Bot addition button */}
      {!hasOpponent && (
        <button
          className="btn-tactile"
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(255, 214, 0, 0.12)',
            border: '1.5px dashed var(--color-steal)',
            color: 'var(--color-steal)',
            fontSize: '0.95rem',
            fontWeight: 800,
            borderRadius: 14,
            cursor: 'pointer'
          }}
          onClick={onAddBot}
          id="add-bot-btn"
        >
          🤖 THÊM BOT ĐỐI THỦ (ĐỂ THI ĐẤU THỬ NGAY)
        </button>
      )}

      {/* Big Ready Action Button */}
      <div>
        <button
          className="btn-tactile"
          style={{
            width: '100%',
            height: 58,
            background: isMyReady ? 'linear-gradient(135deg, #FFD600 0%, #FF9900 100%)' : 'linear-gradient(135deg, #00E676 0%, #00B0FF 100%)',
            color: '#0B132B',
            fontSize: '1.25rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}
          onClick={onToggleReady}
          id="lobby-ready-btn"
        >
          {isMyReady ? 'ĐÃ SẴN SÀNG (BẤM ĐỂ HỦY) ⏳' : 'BẤM SẴN SÀNG THI ĐẤU 🚀'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 10, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {allReady
            ? '🎉 Cả 2 đội đã sẵn sàng! Đang khởi động đếm ngược 3-2-1...'
            : 'Trận đấu sẽ bắt đầu khi cả hai đội đủ người và sẵn sàng (hoặc khi Ban Tổ Chức phát lệnh bắt đầu)!'}
        </p>
      </div>
    </div>
  );
}
