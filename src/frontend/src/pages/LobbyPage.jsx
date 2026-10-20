import React from 'react';

export default function LobbyPage({
  player,
  roomState,
  onSwitchTeam,
  onToggleReady,
  onAddBot,
  onLogout
}) {
  const [isMobile, setIsMobile] = React.useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div style={{ maxWidth: 780, margin: isMobile ? '10px auto' : '18px auto', padding: isMobile ? '0 10px' : '0 16px', width: '100%', display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>
      {/* Top Bar: User Greeting + Room Info + Logout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        {/* User Pill & Logout Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: '#FFFFFF',
            border: '2.5px solid var(--comic-black)',
            boxShadow: 'var(--shadow-3d)',
            padding: '7px 16px',
            borderRadius: 14,
            fontSize: '0.92rem',
            color: 'var(--comic-black)',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>👋</span>
            <span style={{ color: 'var(--blue-dark)' }}>{player?.name}</span>
            <span style={{
              background: '#F2F3FF',
              border: '1.5px solid #C7C9FF',
              color: '#1011B8',
              fontSize: '0.78rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 8
            }}>
              {player?.studentId}
            </span>
          </div>

          <button
            onClick={onLogout}
            id="lobby-logout-btn"
            className="btn-tactile"
            style={{
              background: '#FEE2E2',
              border: '2px solid #DC2626',
              boxShadow: '0 3px 0 #DC2626',
              color: '#DC2626',
              padding: '7px 14px',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Rời phòng đấu để đổi thông tin hoặc vào phòng khác"
          >
            🚪 Rời phòng
          </button>
        </div>

        {/* Room & Mode Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            background: '#FEF08A',
            border: '2.5px solid var(--comic-black)',
            boxShadow: 'var(--shadow-3d)',
            color: '#713F12',
            padding: '6px 14px',
            borderRadius: 12,
            fontFamily: 'var(--font-title)',
            fontWeight: 900,
            fontSize: '1.05rem',
            letterSpacing: 1.5
          }}>
            PHÒNG #{currentRoom}
          </span>
          <span style={{
            background: '#E4E5FF',
            border: '2.5px solid var(--comic-black)',
            boxShadow: 'var(--shadow-3d)',
            color: '#1011B8',
            padding: '6px 14px',
            borderRadius: 12,
            fontSize: '0.86rem',
            fontWeight: 900
          }}>
            🎮 Chế độ: {mode} ({maxPerTeam} vs {maxPerTeam})
          </span>
        </div>
      </div>

      {/* Progress & Ready Banner */}
      <div style={{
        background: allReady ? '#DCFCE7' : '#FFFFFF',
        border: '2.5px solid var(--comic-black)',
        boxShadow: 'var(--shadow-3d)',
        borderRadius: 16,
        padding: '12px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.92rem', color: 'var(--comic-black)', fontWeight: 700 }}>
          <span>
            👥 Đã vào phòng: <strong style={{ color: '#191AFE', fontSize: '1.05rem' }}>{totalPlayers}/{targetTotal}</strong> người
          </span>
          <span style={{ color: '#CBD5E1' }}>•</span>
          <span>
            ⚡ Sẵn sàng: <strong style={{ color: readyCount === targetTotal ? '#16A34A' : '#D97706', fontSize: '1.05rem' }}>{readyCount}/{targetTotal}</strong>
          </span>
        </div>

        <div style={{
          background: allReady ? '#16A34A' : '#F1F5F9',
          border: '1.5px solid ' + (allReady ? '#15803D' : '#CBD5E1'),
          color: allReady ? '#FFFFFF' : '#475569',
          padding: '5px 12px',
          borderRadius: 10,
          fontSize: '0.84rem',
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          {allReady ? '🎉 TẤT CẢ ĐÃ SẴN SÀNG! ĐANG BẮT ĐẦU...' : '⏳ Đang đợi đủ người và sẵn sàng...'}
        </div>
      </div>

      {/* Team Selection Confrontation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Team A Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: currentTeam === 'A' ? '3px solid #0284C7' : '2.5px solid var(--comic-black)',
            boxShadow: currentTeam === 'A' ? '0 6px 0 #0284C7' : 'var(--shadow-3d)',
            borderRadius: 18,
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 16,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Top highlight bar */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #38BDF8 0%, #0284C7 100%)'
          }} />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#E0F2FE',
                border: '2px solid #0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem'
              }}>
                ⚡
              </div>
              <span style={{
                background: teamA.length >= maxPerTeam ? '#DCFCE7' : '#E0F2FE',
                border: '1.5px solid ' + (teamA.length >= maxPerTeam ? '#16A34A' : '#0284C7'),
                color: teamA.length >= maxPerTeam ? '#15803D' : '#0369A1',
                padding: '4px 12px',
                borderRadius: 10,
                fontSize: '0.82rem',
                fontWeight: 900
              }}>
                {teamA.length} / {maxPerTeam} thành viên
              </span>
            </div>

            <h3 style={{
              fontFamily: 'var(--font-title)',
              color: '#0284C7',
              fontSize: '1.25rem',
              fontWeight: 900,
              margin: '0 0 4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              ĐỘI A - TIA CHỚP
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#475569', margin: 0, fontWeight: 600 }}>
              Đội hình công nghệ & phản xạ siêu tốc
            </p>
          </div>

          <button
            className="btn-tactile"
            disabled={currentTeam === 'A' || teamA.length >= maxPerTeam}
            style={{
              padding: '12px',
              borderRadius: 12,
              border: '2.5px solid var(--comic-black)',
              boxShadow: currentTeam === 'A' ? '0 4px 0 #0369A1' : '0 4px 0 var(--comic-black)',
              background: currentTeam === 'A'
                ? 'linear-gradient(180deg, #38BDF8 0%, #0284C7 100%)'
                : (teamA.length >= maxPerTeam ? '#E2E8F0' : '#E0F2FE'),
              color: currentTeam === 'A'
                ? '#FFFFFF'
                : (teamA.length >= maxPerTeam ? '#94A3B8' : '#0284C7'),
              fontSize: '0.92rem',
              fontWeight: 900,
              cursor: currentTeam === 'A' || teamA.length >= maxPerTeam ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s ease'
            }}
            onClick={() => onSwitchTeam('A')}
          >
            {currentTeam === 'A' ? (
              <span>BẠN ĐANG Ở ĐỘI A ✅</span>
            ) : teamA.length >= maxPerTeam ? (
              <span>⛔ ĐỘI A ĐÃ ĐỦ NGƯỜI</span>
            ) : (
              <span>⬅️ CHUYỂN SANG ĐỘI A</span>
            )}
          </button>
        </div>

        {/* Team B Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: currentTeam === 'B' ? '3px solid #EA580C' : '2.5px solid var(--comic-black)',
            boxShadow: currentTeam === 'B' ? '0 6px 0 #EA580C' : 'var(--shadow-3d)',
            borderRadius: 18,
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 16,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Top highlight bar */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #FB923C 0%, #EA580C 100%)'
          }} />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#FFEDD5',
                border: '2px solid #EA580C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem'
              }}>
                🔥
              </div>
              <span style={{
                background: teamB.length >= maxPerTeam ? '#DCFCE7' : '#FFEDD5',
                border: '1.5px solid ' + (teamB.length >= maxPerTeam ? '#16A34A' : '#EA580C'),
                color: teamB.length >= maxPerTeam ? '#15803D' : '#C2410C',
                padding: '4px 12px',
                borderRadius: 10,
                fontSize: '0.82rem',
                fontWeight: 900
              }}>
                {teamB.length} / {maxPerTeam} thành viên
              </span>
            </div>

            <h3 style={{
              fontFamily: 'var(--font-title)',
              color: '#EA580C',
              fontSize: '1.25rem',
              fontWeight: 900,
              margin: '0 0 4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              ĐỘI B - NGỌN LỬA
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#475569', margin: 0, fontWeight: 600 }}>
              Ý chí bền bỉ & bản lĩnh tranh biện
            </p>
          </div>

          <button
            className="btn-tactile"
            disabled={currentTeam === 'B' || teamB.length >= maxPerTeam}
            style={{
              padding: '12px',
              borderRadius: 12,
              border: '2.5px solid var(--comic-black)',
              boxShadow: currentTeam === 'B' ? '0 4px 0 #C2410C' : '0 4px 0 var(--comic-black)',
              background: currentTeam === 'B'
                ? 'linear-gradient(180deg, #FB923C 0%, #EA580C 100%)'
                : (teamB.length >= maxPerTeam ? '#E2E8F0' : '#FFEDD5'),
              color: currentTeam === 'B'
                ? '#FFFFFF'
                : (teamB.length >= maxPerTeam ? '#94A3B8' : '#EA580C'),
              fontSize: '0.92rem',
              fontWeight: 900,
              cursor: currentTeam === 'B' || teamB.length >= maxPerTeam ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s ease'
            }}
            onClick={() => onSwitchTeam('B')}
          >
            {currentTeam === 'B' ? (
              <span>BẠN ĐANG Ở ĐỘI B ✅</span>
            ) : teamB.length >= maxPerTeam ? (
              <span>⛔ ĐỘI B ĐÃ ĐỦ NGƯỜI</span>
            ) : (
              <span>CHUYỂN SANG ĐỘI B ➡️</span>
            )}
          </button>
        </div>
      </div>

      {/* Rosters View - Real-time Player List for all teammates */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Team A Members */}
        <div style={{
          background: '#FFFFFF',
          border: '2.5px solid var(--comic-black)',
          boxShadow: 'var(--shadow-3d)',
          borderRadius: 16,
          padding: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid #E2E8F0' }}>
            <strong style={{ color: '#0284C7', fontWeight: 900 }}>
              ⚡ THÀNH VIÊN ĐỘI A ({teamA.length}/{maxPerTeam})
            </strong>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 900,
              color: readyA ? '#15803D' : '#B45309',
              background: readyA ? '#DCFCE7' : '#FEF3C7',
              border: '1.5px solid ' + (readyA ? '#86EFAC' : '#FDE68A'),
              padding: '3px 8px',
              borderRadius: 8
            }}>
              {readyA ? '✅ SẴN SÀNG' : '⏳ CHỜ SẴN SÀNG'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {teamA.map(p => (
              <div
                key={p.socketId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: p.socketId === player?.socketId ? '#EFF6FF' : '#F8FAFC',
                  border: '1.5px solid ' + (p.socketId === player?.socketId ? '#BFDBFE' : '#E2E8F0'),
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: '0.86rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>👤</span>
                  <strong style={{ color: 'var(--comic-black)' }}>{p.name}</strong>
                  {p.socketId === player?.socketId && (
                    <span style={{
                      background: '#0284C7',
                      color: '#FFFFFF',
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      padding: '1px 6px',
                      borderRadius: 6
                    }}>
                      BẠN
                    </span>
                  )}
                  <span style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 600 }}>({p.studentId})</span>
                </div>
                <span style={{
                  color: p.isReady ? '#15803D' : '#B45309',
                  background: p.isReady ? '#DCFCE7' : '#FEF3C7',
                  border: '1px solid ' + (p.isReady ? '#86EFAC' : '#FDE68A'),
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontWeight: 900,
                  fontSize: '0.76rem'
                }}>
                  {p.isReady ? '✅ SẴN SÀNG' : '⏳ CHỜ'}
                </span>
              </div>
            ))}
            {teamA.length === 0 && (
              <div style={{
                color: '#64748B',
                fontSize: '0.84rem',
                fontStyle: 'italic',
                padding: '12px',
                textAlign: 'center',
                background: '#F8FAFC',
                borderRadius: 10,
                border: '1.5px dashed #CBD5E1'
              }}>
                Chưa có đấu thủ vào Đội A
              </div>
            )}
          </div>
        </div>

        {/* Team B Members */}
        <div style={{
          background: '#FFFFFF',
          border: '2.5px solid var(--comic-black)',
          boxShadow: 'var(--shadow-3d)',
          borderRadius: 16,
          padding: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid #E2E8F0' }}>
            <strong style={{ color: '#EA580C', fontWeight: 900 }}>
              🔥 THÀNH VIÊN ĐỘI B ({teamB.length}/{maxPerTeam})
            </strong>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 900,
              color: readyB ? '#15803D' : '#B45309',
              background: readyB ? '#DCFCE7' : '#FEF3C7',
              border: '1.5px solid ' + (readyB ? '#86EFAC' : '#FDE68A'),
              padding: '3px 8px',
              borderRadius: 8
            }}>
              {readyB ? '✅ SẴN SÀNG' : '⏳ CHỜ SẴN SÀNG'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {teamB.map(p => (
              <div
                key={p.socketId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: p.socketId === player?.socketId ? '#FFF7ED' : '#F8FAFC',
                  border: '1.5px solid ' + (p.socketId === player?.socketId ? '#FED7AA' : '#E2E8F0'),
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: '0.86rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>👤</span>
                  <strong style={{ color: 'var(--comic-black)' }}>{p.name}</strong>
                  {p.socketId === player?.socketId && (
                    <span style={{
                      background: '#EA580C',
                      color: '#FFFFFF',
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      padding: '1px 6px',
                      borderRadius: 6
                    }}>
                      BẠN
                    </span>
                  )}
                  <span style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 600 }}>({p.studentId})</span>
                </div>
                <span style={{
                  color: p.isReady ? '#15803D' : '#B45309',
                  background: p.isReady ? '#DCFCE7' : '#FEF3C7',
                  border: '1px solid ' + (p.isReady ? '#86EFAC' : '#FDE68A'),
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontWeight: 900,
                  fontSize: '0.76rem'
                }}>
                  {p.isReady ? '✅ SẴN SÀNG' : '⏳ CHỜ'}
                </span>
              </div>
            ))}
            {teamB.length === 0 && (
              <div style={{
                color: '#64748B',
                fontSize: '0.84rem',
                fontStyle: 'italic',
                padding: '12px',
                textAlign: 'center',
                background: '#F8FAFC',
                borderRadius: 10,
                border: '1.5px dashed #CBD5E1'
              }}>
                Chưa có đấu thủ vào Đội B
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
            padding: '14px',
            background: '#FEF9C3',
            border: '2.5px solid var(--comic-black)',
            boxShadow: 'var(--shadow-3d)',
            color: '#854D0E',
            fontSize: '0.96rem',
            fontWeight: 900,
            borderRadius: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10
          }}
          onClick={onAddBot}
          id="add-bot-btn"
        >
          <span>🤖</span>
          <span>THÊM BOT ĐỐI THỦ (ĐỂ THI ĐẤU THỬ NGAY)</span>
        </button>
      )}

      {/* Big Ready Action Button */}
      <div>
        <button
          className="btn-tactile"
          style={{
            width: '100%',
            height: isMobile ? 52 : 60,
            borderRadius: 16,
            border: '3px solid var(--comic-black)',
            boxShadow: isMyReady ? '0 5px 0 #92400E' : '0 6px 0 var(--comic-black)',
            background: isMyReady
              ? 'linear-gradient(180deg, #FACC15 0%, #EAB308 100%)'
              : 'linear-gradient(180deg, #22C55E 0%, #16A34A 100%)',
            color: isMyReady ? '#713F12' : '#FFFFFF',
            fontSize: isMobile ? '1.02rem' : '1.22rem',
            fontWeight: 900,
            letterSpacing: '0.04em',
            textShadow: isMyReady ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10
          }}
          onClick={onToggleReady}
          id="lobby-ready-btn"
        >
          {isMyReady ? (
            <>
              <span>⏳</span>
              <span>ĐÃ SẴN SÀNG (BẤM ĐỂ HỦY)</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>BẤM SẴN SÀNG THI ĐẤU</span>
            </>
          )}
        </button>

        <p style={{
          textAlign: 'center',
          marginTop: 12,
          fontSize: '0.86rem',
          color: '#334155',
          fontWeight: 700
        }}>
          {allReady
            ? '🎉 Cả 2 đội đã sẵn sàng! Đang khởi động đếm ngược 3-2-1...'
            : '📌 Trận đấu sẽ bắt đầu khi cả hai đội đủ người và sẵn sàng (hoặc khi Ban Tổ Chức phát lệnh bắt đầu)!'}
        </p>
      </div>
    </div>
  );
}
