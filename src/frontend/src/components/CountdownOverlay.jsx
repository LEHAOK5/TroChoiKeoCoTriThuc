import React, { useEffect } from 'react';
import { announceStart } from '../utils/announcer';

export default function CountdownOverlay({ seconds, roomState, player }) {
  if (seconds === null || seconds === undefined) return null;

  const teamA = roomState?.teamA || [
    { name: player?.team === 'A' ? player?.name : 'Đội A', studentId: player?.team === 'A' ? player?.studentId : '231A...' }
  ];
  const teamB = roomState?.teamB || [
    { name: player?.team === 'B' ? player?.name : 'Đội B', studentId: player?.team === 'B' ? player?.studentId : '231A...' }
  ];
  const roomCode = roomState?.roomCode || '1234';
  const mode = roomState?.mode || '1vs1';
  const maxPerTeam = roomState?.maxPerTeam || 1;

  // Haptic feedback & voice announcer per second
  useEffect(() => {
    if (seconds === 0) {
      announceStart();
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        if (seconds === 0) {
          navigator.vibrate([100, 50, 180]);
        } else if (seconds > 0) {
          navigator.vibrate(60);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [seconds]);

  // Color config per count
  const stageConfig = {
    3: {
      color: '#191AFE',
      borderColor: '#191AFE',
      bgGlow: 'rgba(25, 26, 254, 0.25)',
      badgeBg: '#E4E5FF',
      badgeText: '#1011B8',
      label: 'CHUẨN BỊ... ⚡',
      hint: 'Hai đội vào vị trí sẵn sàng!'
    },
    2: {
      color: '#B45309',
      borderColor: '#FACC15',
      bgGlow: 'rgba(250, 204, 21, 0.25)',
      badgeBg: '#FEF08A',
      badgeText: '#713F12',
      label: 'SẴN SÀNG... 🔔',
      hint: 'Dây thừng kéo co bắt đầu căng!'
    },
    1: {
      color: '#DC2626',
      borderColor: '#FF5722',
      bgGlow: 'rgba(255, 87, 34, 0.25)',
      badgeBg: '#FFEDD5',
      badgeText: '#C2410C',
      label: 'TẬP TRUNG... 🔥',
      hint: 'Chuẩn bị tay bấm chuông cướp quyền!'
    },
    0: {
      color: '#15803D',
      borderColor: '#16A34A',
      bgGlow: 'rgba(22, 163, 74, 0.3)',
      badgeBg: '#DCFCE7',
      badgeText: '#15803D',
      label: 'BẮT ĐẦU KÉO! 🚀',
      hint: 'CHIẾN HẾT MÌNH VÌ MÀU CỜ SẮC ÁO!'
    }
  };

  const currentStage = stageConfig[seconds] || stageConfig[0];

  return (
    <div className="faceoff-backdrop">
      {/* Top Banner: Arena Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20
        }}
      >
        <div
          style={{
            background: '#FEF08A',
            border: '2.5px solid var(--comic-black)',
            boxShadow: 'var(--shadow-3d)',
            padding: '6px 16px',
            borderRadius: 14,
            fontFamily: 'var(--font-title)',
            fontWeight: 900,
            fontSize: '1.05rem',
            color: '#713F12',
            letterSpacing: 1.5
          }}
        >
          PHÒNG #{roomCode}
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '2.5px solid var(--comic-black)',
            boxShadow: 'var(--shadow-3d)',
            padding: '6px 18px',
            borderRadius: 14,
            fontSize: '0.92rem',
            fontWeight: 900,
            color: '#191AFE',
            letterSpacing: 1
          }}
        >
          ⚔️ SÂN ĐẤU KÉO CO TRI THỨC
        </div>

        <div
          style={{
            background: '#E4E5FF',
            border: '2.5px solid var(--comic-black)',
            boxShadow: 'var(--shadow-3d)',
            padding: '6px 14px',
            borderRadius: 14,
            fontSize: '0.86rem',
            fontWeight: 900,
            color: '#1011B8'
          }}
        >
          🎮 Thể thức: {mode} ({maxPerTeam} vs {maxPerTeam})
        </div>
      </div>

      {/* Main Face-Off Confrontation Board */}
      <div
        style={{
          width: '100%',
          maxWidth: 920,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 16
        }}
      >
        {/* Left: Team A (Tia Chớp ⚡) */}
        <div
          style={{
            background: '#FFFFFF',
            border: '3px solid #0284C7',
            boxShadow: '0 8px 0 #0284C7',
            borderRadius: 22,
            padding: '20px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            animation: 'faceoffSlideLeft 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              background: 'linear-gradient(90deg, #38BDF8 0%, #0284C7 100%)'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: '#E0F2FE',
                border: '2px solid #0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem'
              }}
            >
              ⚡
            </div>
            <span
              style={{
                background: '#E0F2FE',
                color: '#0284C7',
                border: '1.5px solid #0284C7',
                padding: '3px 10px',
                borderRadius: 10,
                fontSize: '0.78rem',
                fontWeight: 900
              }}
            >
              {teamA.length} THÀNH VIÊN
            </span>
          </div>

          <div>
            <h3
              style={{
                fontFamily: 'var(--font-title)',
                color: '#0284C7',
                fontSize: '1.35rem',
                fontWeight: 900,
                margin: '0 0 4px 0'
              }}
            >
              ĐỘI A - TIA CHỚP
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', fontWeight: 700 }}>
              Tốc độ & Phản xạ công nghệ
            </p>
          </div>

          {/* Members preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {teamA.map((m, idx) => (
              <div
                key={idx}
                style={{
                  background: m.name === player?.name ? '#EFF6FF' : '#F8FAFC',
                  border: '1.5px solid ' + (m.name === player?.name ? '#0284C7' : '#E2E8F0'),
                  padding: '6px 10px',
                  borderRadius: 10,
                  fontSize: '0.84rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontWeight: 800, color: '#0F172A' }}>
                  👤 {m.name} {m.name === player?.name && <span style={{ color: '#0284C7' }}>(Bạn)</span>}
                </span>
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                  {m.studentId || ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Big 3-2-1 Countdown Nexus */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            minWidth: 220
          }}
        >
          {/* VS Badge */}
          <div
            style={{
              background: '#FEF08A',
              border: '3px solid var(--comic-black)',
              boxShadow: '0 4px 0 var(--comic-black)',
              color: '#713F12',
              fontFamily: 'var(--font-title)',
              fontWeight: 900,
              fontSize: '1.2rem',
              padding: '4px 16px',
              borderRadius: 20,
              letterSpacing: 2,
              animation: 'vsClashPulse 1s ease-in-out infinite'
            }}
          >
            ⚔️ VS ⚔️
          </div>

          {/* Giant Countdown Ring Circle */}
          <div
            key={seconds}
            style={{
              width: 170,
              height: 170,
              borderRadius: '50%',
              background: '#FFFFFF',
              border: `5px solid ${currentStage.borderColor}`,
              boxShadow: `0 10px 0 var(--comic-black), 0 0 40px ${currentStage.bgGlow}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'countdownPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative'
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-title)',
                fontSize: seconds > 0 ? '5.6rem' : '2.8rem',
                fontWeight: 900,
                color: currentStage.color,
                lineHeight: 1,
                textShadow: '3px 3px 0 var(--comic-black)',
                letterSpacing: seconds > 0 ? '0' : '0.04em'
              }}
            >
              {seconds > 0 ? seconds : 'CHIẾN!'}
            </div>
          </div>

          {/* Subtitle Badge */}
          <div
            key={`badge-${seconds}`}
            style={{
              background: currentStage.badgeBg,
              border: `2px solid var(--comic-black)`,
              boxShadow: '0 3px 0 var(--comic-black)',
              color: currentStage.badgeText,
              padding: '6px 18px',
              borderRadius: 999,
              fontFamily: 'var(--font-title)',
              fontWeight: 900,
              fontSize: '0.96rem',
              letterSpacing: '0.04em',
              textAlign: 'center',
              animation: 'countdownPop 0.35s ease'
            }}
          >
            {currentStage.label}
          </div>
        </div>

        {/* Right: Team B (Ngọn Lửa 🔥) */}
        <div
          style={{
            background: '#FFFFFF',
            border: '3px solid #EA580C',
            boxShadow: '0 8px 0 #EA580C',
            borderRadius: 22,
            padding: '20px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            animation: 'faceoffSlideRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              background: 'linear-gradient(90deg, #FB923C 0%, #EA580C 100%)'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: '#FFEDD5',
                border: '2px solid #EA580C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem'
              }}
            >
              🔥
            </div>
            <span
              style={{
                background: '#FFEDD5',
                color: '#EA580C',
                border: '1.5px solid #EA580C',
                padding: '3px 10px',
                borderRadius: 10,
                fontSize: '0.78rem',
                fontWeight: 900
              }}
            >
              {teamB.length} THÀNH VIÊN
            </span>
          </div>

          <div>
            <h3
              style={{
                fontFamily: 'var(--font-title)',
                color: '#EA580C',
                fontSize: '1.35rem',
                fontWeight: 900,
                margin: '0 0 4px 0'
              }}
            >
              ĐỘI B - NGỌN LỬA
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', fontWeight: 700 }}>
              Ý chí & Bản lĩnh tranh biện
            </p>
          </div>

          {/* Members preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {teamB.map((m, idx) => (
              <div
                key={idx}
                style={{
                  background: m.name === player?.name ? '#FFF7ED' : '#F8FAFC',
                  border: '1.5px solid ' + (m.name === player?.name ? '#EA580C' : '#E2E8F0'),
                  padding: '6px 10px',
                  borderRadius: 10,
                  fontSize: '0.84rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontWeight: 800, color: '#0F172A' }}>
                  👤 {m.name} {m.name === player?.name && <span style={{ color: '#EA580C' }}>(Bạn)</span>}
                </span>
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                  {m.studentId || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tension Rope & Flag Graphic */}
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          marginTop: 24,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'ropeTensionShake 0.6s ease-in-out infinite'
        }}
      >
        {/* Rope Line */}
        <div
          style={{
            width: '100%',
            height: 12,
            background: 'repeating-linear-gradient(45deg, #B45309, #B45309 10px, #D97706 10px, #D97706 20px)',
            border: '2.5px solid var(--comic-black)',
            boxShadow: '0 3px 0 var(--comic-black)',
            borderRadius: 6,
            position: 'relative'
          }}
        >
          {/* Red Ribbon Center Marker */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 22,
              height: 28,
              background: '#EF4444',
              border: '2px solid var(--comic-black)',
              boxShadow: '0 2px 0 var(--comic-black)',
              borderRadius: 4
            }}
          />
        </div>

        {/* Stadium Referee Prompt */}
        <div
          style={{
            marginTop: 14,
            fontSize: '0.88rem',
            fontWeight: 800,
            color: '#FEF08A',
            textShadow: '1px 1px 0 var(--comic-black)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span>📢</span>
          <span>{currentStage.hint}</span>
        </div>
      </div>
    </div>
  );
}
