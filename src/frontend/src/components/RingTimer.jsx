import React, { useEffect } from 'react';

export default function RingTimer({
  seconds = 10,
  totalSeconds = 15,
  size = 46,
  strokeWidth = 4,
  label = ''
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, seconds / (totalSeconds || 15)));
  const strokeDashoffset = circumference * (1 - progress);

  const isCritical = seconds <= 3 && seconds > 0;
  // Progress color: Blue -> Yellow -> Red
  const strokeColor = isCritical ? '#EF4444' : progress > 0.45 ? '#1A1AFF' : '#F59E0B';

  useEffect(() => {
    if (isCritical && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(45);
      } catch {
        // ignore
      }
    }
  }, [seconds, isCritical]);

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
      className={isCritical ? 'ring-timer-critical' : ''}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Track with Comic Border */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        {/* Dynamic Sweep Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.25s linear, stroke 0.3s ease'
          }}
        />
      </svg>
      {/* Central Seconds Display */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-title)',
          fontWeight: 900,
          fontSize: size >= 48 ? '1.15rem' : '0.92rem',
          color: strokeColor,
          lineHeight: 1
        }}
      >
        <span>{Math.max(0, seconds)}</span>
        {label && <span style={{ fontSize: '0.55rem', opacity: 0.7 }}>{label}</span>}
      </div>
    </div>
  );
}
