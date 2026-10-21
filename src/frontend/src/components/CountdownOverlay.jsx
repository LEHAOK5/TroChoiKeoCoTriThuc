import React, { useState, useEffect } from 'react';
import { announceStart } from '../utils/announcer';

export default function CountdownOverlay({ seconds, roomState, player }) {
  if (seconds === null || seconds === undefined) return null;

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      color: '#1A1AFF',
      borderColor: '#1A1AFF',
      bgGlow: 'rgba(26, 26, 255, 0.35)',
      badgeBg: '#E6E6FF',
      badgeText: '#1010CC',
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
    <div className="faceoff-backdrop" style={{ padding: isMobile ? '12px 10px' : '20px' }}>
      {/* Top Banner: Arena Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: isMobile ? 6 : 12,
          marginBottom: isMobile ? 12 : 20
        }}
      >
        <div
          style={{
            background: '#FEF08A',
            border: '2px solid var(--comic-black)',
            boxShadow: 'var(--shadow-3d)',
            padding: isMobile ? '4px 10px' : '6px 16px',
            borderRadius: 12,
            fontFamily: 'var(--font-title)',
            fontWeight: 900,
            fontSize: isMobile ? '0.85rem' : '1.05rem',
            color: '#713F12',
            letterSpacing: 1
          }}
        >
          PHÒNG #{roomCode}
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '2px solid var(--comic-black)',
            boxShadow: 'var(--shadow-3d)',
            padding: isMobile ? '4px 12px' : '6px 18px',
            borderRadius: 12,
            fontSize: isMobile ? '0.82rem' : '0.92rem',
            fontWeight: 900,
            color: '#1A1AFF',
            letterSpacing: 0.5
          }}
        >
          ⚔️ SÂN ĐẤU KÉO CO TRI THỨC
        </div>

        <div
          style={{
            background: '#E6E6FF',
            border: '2px solid var(--comic-black)',
            boxShadow: 'var(--shadow-3d)',
            padding: isMobile ? '4px 10px' : '6px 14px',
            borderRadius: 12,
            fontSize: isMobile ? '0.78rem' : '0.86rem',
            fontWeight: 900,
            color: '#1010CC'
          }}
        >
          🎮 {mode} ({maxPerTeam}vs{maxPerTeam})
        </div>
      </div>

      {/* MOBILE LAYOUT: Stacked Face-Off Bar + Center Pulse Circle */}
      {isMobile ? (
        <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Confrontation Horizontal Bar */}
          <div
            style={{
              width: '100%',
              background: '#FFFFFF',
              border: '2.5px solid var(--comic-black)',
              borderRadius: 16,
              padding: '10px 12px',
              boxShadow: '0 4px 0 var(--comic-black)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 10
            }}
          >
            {/* Team A mini card */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#E6E6FF', border: '1.5px solid #1A1AFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>⚡</div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontFamily: 'var(--font-title)', fontWeight: 900, color: '#1A1AFF', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>ĐỘI A - TIA CHỚP</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {teamA[0]?.name || 'Tia Chớp'}
                </div>
              </div>
            </div>

            {/* VS Badge */}
            <div style={{ background: '#FEF08A', border: '2px solid var(--comic-black)', borderRadius: 8, padding: '3px 8px', fontFamily: 'var(--font-title)', fontWeight: 900, fontSize: '0.8rem', color: '#713F12', flexShrink: 0 }}>
              VS
            </div>

            {/* Team B mini card */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, minWidth: 0, textAlign: 'right' }}>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontFamily: 'var(--font-title)', fontWeight: 900, color: '#EA580C', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>ĐỘI B - NGỌN LỬA</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {teamB[0]?.name || 'Ngọn Lửa'}
                </div>
              </div>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFEDD5', border: '1.5px solid #EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🔥</div>
            </div>
          </div>

          {/* Center Giant Countdown Circle */}
          <div
            key={seconds}
            style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: '#FFFFFF',
              border: `5px solid ${currentStage.borderColor}`,
              boxShadow: `0 0 35px ${currentStage.bgGlow}, 0 6px 0 var(--comic-black)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '8px 0',
              animation: 'countdownPulse 1s infinite alternate ease-in-out'
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-title)',
                fontSize: seconds > 0 ? '4.8rem' : '2.2rem',
                fontWeight: 900,
                color: currentStage.color,
                lineHeight: 1,
                textShadow: '2.5px 2.5px 0 var(--comic-black)',
                letterSpacing: seconds > 0 ? '0' : '0.04em'
              }}
            >
              {seconds > 0 ? seconds : 'CHIẾN!'}
            </div>
          </div>

          {/* Subtitle Badge */}
          <div
            key={`badge-mob-${seconds}`}
            style={{
              background: currentStage.badgeBg,
              border: '2px solid var(--comic-black)',
              boxShadow: '0 3px 0 var(--comic-black)',
              color: currentStage.badgeText,
              padding: '6px 18px',
              borderRadius: 999,
              fontFamily: 'var(--font-title)',
              fontWeight: 900,
              fontSize: '0.92rem',
              letterSpacing: '0.04em',
              textAlign: 'center',
              animation: 'countdownPop 0.35s ease',
              marginBottom: 8
            }}
          >
            {currentStage.label}
          </div>
        </div>
      ) : (
        /* DESKTOP LAYOUT: 3 Columns Face-Off Board */
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
            border: '3px solid #1A1AFF',
            boxShadow: '0 8px 0 #1A1AFF',
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
              background: 'linear-gradient(90deg, #4A4AFF 0%, #1A1AFF 100%)'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: '#E6E6FF',
                border: '2px solid #1A1AFF',
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
                background: '#E6E6FF',
                color: '#1A1AFF',
                border: '1.5px solid #1A1AFF',
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
                color: '#1A1AFF',
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
                  background: m.name === player?.name ? '#F3F3FF' : '#F8FAFC',
                  border: '1.5px solid ' + (m.name === player?.name ? '#1A1AFF' : '#E2E8F0'),
                  padding: '6px 10px',
                  borderRadius: 10,
                  fontSize: '0.84rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontWeight: 800, color: '#0F172A' }}>
                  👤 {m.name} {m.name === player?.name && <span style={{ color: '#1A1AFF' }}>(Bạn)</span>}
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
    )}

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
