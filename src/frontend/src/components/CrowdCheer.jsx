import React from 'react';

export default function CrowdCheer({ team = 'A', isCheering = false, isDismayed = false }) {
  const isA = team === 'A';
  const colorMain = isA ? '#0284C7' : '#EA580C';
  const colorSub = isA ? '#38BDF8' : '#F97316';
  const teamIcon = isA ? '⚡' : '🔥';
  const slogan = isA ? 'VHU TIA CHỚP CỐ LÊN!' : 'VHU NGỌN LỬA VÔ ĐỊCH!';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 6,
        padding: '0 8px',
        pointerEvents: 'none',
        userSelect: 'none',
        position: 'relative'
      }}
    >
      {/* Floating Team Cheer Banner */}
      <div
        style={{
          position: 'absolute',
          top: -16,
          [isA ? 'left' : 'right']: 8,
          background: isA ? '#E0F2FE' : '#FFEDD5',
          border: '1.5px solid #0F172A',
          borderRadius: 8,
          padding: '1px 6px',
          fontSize: '9px',
          fontWeight: 900,
          fontFamily: 'var(--font-title)',
          color: colorMain,
          boxShadow: '0 2px 0 #0F172A',
          whiteSpace: 'nowrap',
          transform: isA ? 'rotate(-3deg)' : 'rotate(3deg)',
          animation: isCheering ? 'bannerWave 0.6s infinite alternate ease-in-out' : 'none'
        }}
      >
        {teamIcon} {slogan}
      </div>

      {/* Fan 1: Flag Waver */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: isCheering
            ? 'crowdJump 0.35s infinite alternate ease-in-out 0s'
            : 'crowdBob 1.4s infinite ease-in-out 0s'
        }}
      >
        {/* Animated Flag */}
        <div
          style={{
            fontSize: '15px',
            transform: isA ? 'rotate(-15deg)' : 'rotate(15deg)',
            marginBottom: -2,
            animation: 'flagFlutter 0.5s infinite alternate ease-in-out'
          }}
        >
          {isA ? '🚩' : '🎏'}
        </div>
        {/* Chibi Head */}
        <svg viewBox="0 0 24 28" width="26" height="30">
          <ellipse cx="12" cy="10" rx="7" ry="8" fill="#FED7AA" stroke="#0F172A" strokeWidth="1.5" />
          {/* Headband */}
          <path d="M 5 8 Q 12 5 19 8 L 19 11 Q 12 8 5 11 Z" fill={colorMain} stroke="#0F172A" strokeWidth="1" />
          {/* Cheering eyes */}
          <path d="M 8 10 Q 10 8 12 10" fill="none" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 13 10 Q 15 8 17 10" fill="none" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />
          {/* Open mouth */}
          <ellipse cx="12" cy="14" rx="2" ry="2.5" fill="#EF4444" stroke="#0F172A" strokeWidth="1" />
          {/* Shirt */}
          <path d="M 6 18 C 6 18, 5 26, 7 27 C 10 28, 14 28, 17 27 C 19 26, 18 18, 18 18 Z" fill={colorMain} stroke="#0F172A" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Fan 2: Drummer / Pom-pom Cheerleader */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: isCheering
            ? 'crowdJump 0.35s infinite alternate ease-in-out 0.15s'
            : 'crowdBob 1.4s infinite ease-in-out 0.25s'
        }}
      >
        <span style={{ fontSize: '14px', marginBottom: -2 }}>
          {isA ? '✨' : '🥁'}
        </span>
        <svg viewBox="0 0 24 28" width="28" height="32">
          <ellipse cx="12" cy="10" rx="7.5" ry="8.5" fill="#FED7AA" stroke="#0F172A" strokeWidth="1.5" />
          {/* Hair/Cap */}
          <path d="M 5 9 Q 12 4 19 9" fill="none" stroke="#713F12" strokeWidth="2.5" strokeLinecap="round" />
          {/* Happy Eyes */}
          <circle cx="9.5" cy="10" r="1.2" fill="#0F172A" />
          <circle cx="14.5" cy="10" r="1.2" fill="#0F172A" />
          {/* Smiling Mouth */}
          <path d="M 10 13 Q 12 16 14 13" fill="none" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />
          {/* Shirt */}
          <path d="M 5 18 C 5 18, 4 27, 6 28 C 10 28, 14 28, 18 28 C 20 27, 19 18, 19 18 Z" fill={colorSub} stroke="#0F172A" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Fan 3: Mascot / Hands in the air */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: isCheering
            ? 'crowdJump 0.35s infinite alternate ease-in-out 0.3s'
            : 'crowdBob 1.4s infinite ease-in-out 0.5s'
        }}
      >
        <span style={{ fontSize: '15px', marginBottom: -2 }}>
          {teamIcon}
        </span>
        <svg viewBox="0 0 24 28" width="26" height="30">
          <ellipse cx="12" cy="10" rx="7" ry="8" fill="#FED7AA" stroke="#0F172A" strokeWidth="1.5" />
          {/* Cap */}
          <path d="M 5 8 Q 12 3 19 8 L 22 9" fill="none" stroke={colorMain} strokeWidth="2" strokeLinecap="round" />
          {/* Clapped Hands */}
          <path d="M 3 14 L 6 9" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
          <path d="M 21 14 L 18 9" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
          {/* Shirt */}
          <path d="M 6 18 C 6 18, 5 26, 7 27 C 10 28, 14 28, 17 27 C 19 26, 18 18, 18 18 Z" fill={colorMain} stroke="#0F172A" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}
