import React, { useState, useEffect, useRef } from 'react';

export default function CrowdCheer({ team = 'A', isCheering = false, isDismayed = false, isBuzzed = false }) {
  const isA = team === 'A';
  const colorMain = isA ? '#1A1AFF' : '#EA580C';
  const colorSub = isA ? '#4A4AFF' : '#F97316';
  const teamIcon = isA ? '⚡' : '🔥';
  const slogan = isA ? 'VHU TIA CHỚP CỐ LÊN!' : 'VHU NGỌN LỬA VÔ ĐỊCH!';

  const [bubbles, setBubbles] = useState([]);
  const prevCheeringRef = useRef(isCheering);
  const prevDismayedRef = useRef(isDismayed);
  const prevBuzzedRef = useRef(isBuzzed);

  const spawnBubbles = (icons, count = 4) => {
    const newItems = [];
    for (let i = 0; i < count; i++) {
      const icon = icons[Math.floor(Math.random() * icons.length)];
      newItems.push({
        id: `${Date.now()}-${Math.random()}`,
        icon,
        left: 10 + Math.random() * 80,
        size: 16 + Math.floor(Math.random() * 8),
        delay: (i * 0.12).toFixed(2)
      });
    }
    setBubbles(prev => [...prev.slice(-12), ...newItems]);
  };

  // Bắn bóng cảm xúc khi đội ghi điểm / reo mừng
  useEffect(() => {
    if (isCheering && !prevCheeringRef.current) {
      const cheerIcons = ['🔥', '⚡', '❤️', '🏆', '👏', '🎉'];
      spawnBubbles(cheerIcons, 5);
    }
    prevCheeringRef.current = isCheering;
  }, [isCheering]);

  // Bắn bóng cảm xúc khi đội trả lời sai / tiếc nuối
  useEffect(() => {
    if (isDismayed && !prevDismayedRef.current) {
      spawnBubbles(['😮', '💔', '💧', '⚡'], 3);
    }
    prevDismayedRef.current = isDismayed;
  }, [isDismayed]);

  // Bắn bóng cảm xúc khi có chuông
  useEffect(() => {
    if (isBuzzed && !prevBuzzedRef.current) {
      spawnBubbles([teamIcon, '🔔', '⚡'], 2);
    }
    prevBuzzedRef.current = isBuzzed;
  }, [isBuzzed, teamIcon]);

  // Ambient idle: thỉnh thoảng khán đài tự thả 1 icon nhẹ nhàng
  useEffect(() => {
    const timer = setInterval(() => {
      const idleIcons = [teamIcon, '❤️', '✨'];
      const icon = idleIcons[Math.floor(Math.random() * idleIcons.length)];
      setBubbles(prev => [
        ...prev.slice(-10),
        {
          id: `${Date.now()}-${Math.random()}`,
          icon,
          left: 15 + Math.random() * 70,
          size: 14 + Math.floor(Math.random() * 6),
          delay: 0
        }
      ]);
    }, 4500 + Math.random() * 2000);

    return () => clearInterval(timer);
  }, [teamIcon]);

  // Tự dọn dẹp các bong bóng cũ sau khi bay xong
  useEffect(() => {
    if (bubbles.length === 0) return;
    const cleanTimer = setTimeout(() => {
      setBubbles(prev => prev.filter(b => Date.now() - parseInt(b.id) < 1800));
    }, 1800);
    return () => clearTimeout(cleanTimer);
  }, [bubbles]);

  const fanAnim = (delaySec) => {
    if (isCheering) return `crowdJump 0.35s infinite alternate ease-in-out ${delaySec}s`;
    if (isDismayed) return `crowdDismayed 1s infinite ease-in-out ${delaySec}s`;
    return `crowdBob 1.4s infinite ease-in-out ${delaySec}s`;
  };

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
      {/* Floating Emotion Bubbles */}
      {bubbles.map(b => (
        <div
          key={b.id}
          className="emotion-bubble"
          style={{
            left: `${b.left}%`,
            top: '-12px',
            fontSize: `${b.size}px`,
            animationDelay: `${b.delay}s`
          }}
        >
          {b.icon}
        </div>
      ))}

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
          animation: fanAnim(0)
        }}
      >
        {/* Animated Flag */}
        <div
          style={{
            fontSize: '15px',
            transform: isDismayed
              ? (isA ? 'rotate(40deg)' : 'rotate(-40deg)')
              : (isA ? 'rotate(-15deg)' : 'rotate(15deg)'),
            marginBottom: -2,
            transition: 'transform 0.3s ease',
            animation: !isDismayed ? 'flagFlutter 0.5s infinite alternate ease-in-out' : 'none'
          }}
        >
          {isA ? '🚩' : '🎏'}
        </div>
        {/* Chibi Head */}
        <svg viewBox="0 0 24 28" width="26" height="30">
          <ellipse cx="12" cy="10" rx="7" ry="8" fill="#FED7AA" stroke="#0F172A" strokeWidth="1.5" />
          {/* Headband */}
          <path d="M 5 8 Q 12 5 19 8 L 19 11 Q 12 8 5 11 Z" fill={colorMain} stroke="#0F172A" strokeWidth="1" />
          {/* Cheering / Dismayed eyes */}
          {isDismayed ? (
            <>
              <line x1="8" y1="8" x2="11" y2="11" stroke="#0F172A" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="8" y1="11" x2="11" y2="8" stroke="#0F172A" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="13" y1="8" x2="16" y2="11" stroke="#0F172A" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="13" y1="11" x2="16" y2="8" stroke="#0F172A" strokeWidth="1.4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M 8 10 Q 10 8 12 10" fill="none" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M 13 10 Q 15 8 17 10" fill="none" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />
            </>
          )}
          {/* Mouth */}
          {isDismayed ? (
            <path d="M 10 15 Q 12 12 14 15" fill="none" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />
          ) : (
            <ellipse cx="12" cy="14" rx="2" ry="2.5" fill="#EF4444" stroke="#0F172A" strokeWidth="1" />
          )}
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
          animation: fanAnim(0.15)
        }}
      >
        <span style={{ fontSize: '14px', marginBottom: -2 }}>
          {isDismayed ? '💧' : (isA ? '✨' : '🥁')}
        </span>
        <svg viewBox="0 0 24 28" width="28" height="32">
          <ellipse cx="12" cy="10" rx="7.5" ry="8.5" fill="#FED7AA" stroke="#0F172A" strokeWidth="1.5" />
          {/* Hair/Cap */}
          <path d="M 5 9 Q 12 4 19 9" fill="none" stroke="#713F12" strokeWidth="2.5" strokeLinecap="round" />
          {/* Eyes */}
          {isDismayed ? (
            <>
              <circle cx="9.5" cy="11" r="1.2" fill="#0F172A" />
              <circle cx="14.5" cy="11" r="1.2" fill="#0F172A" />
              {/* Teardrop */}
              <circle cx="7" cy="13" r="1.2" fill="#4A4AFF" />
            </>
          ) : (
            <>
              <circle cx="9.5" cy="10" r="1.2" fill="#0F172A" />
              <circle cx="14.5" cy="10" r="1.2" fill="#0F172A" />
            </>
          )}
          {/* Mouth */}
          {isDismayed ? (
            <path d="M 10 15 Q 12 13 14 15" fill="none" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />
          ) : (
            <path d="M 10 13 Q 12 16 14 13" fill="none" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />
          )}
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
          animation: fanAnim(0.3)
        }}
      >
        <span style={{ fontSize: '15px', marginBottom: -2 }}>
          {isDismayed ? '😮' : teamIcon}
        </span>
        <svg viewBox="0 0 24 28" width="26" height="30">
          <ellipse cx="12" cy="10" rx="7" ry="8" fill="#FED7AA" stroke="#0F172A" strokeWidth="1.5" />
          {/* Cap */}
          <path d="M 5 8 Q 12 3 19 8 L 22 9" fill="none" stroke={colorMain} strokeWidth="2" strokeLinecap="round" />
          {/* Hands */}
          {isDismayed ? (
            <>
              {/* Hands covering cheeks */}
              <circle cx="4" cy="11" r="2.5" fill="#FED7AA" stroke="#0F172A" strokeWidth="1" />
              <circle cx="20" cy="11" r="2.5" fill="#FED7AA" stroke="#0F172A" strokeWidth="1" />
            </>
          ) : (
            <>
              {/* Clapped Hands in air */}
              <path d="M 3 14 L 6 9" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
              <path d="M 21 14 L 18 9" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
          {/* Shirt */}
          <path d="M 6 18 C 6 18, 5 26, 7 27 C 10 28, 14 28, 17 27 C 19 26, 18 18, 18 18 Z" fill={colorMain} stroke="#0F172A" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}
