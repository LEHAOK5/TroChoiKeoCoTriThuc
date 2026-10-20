import React from 'react';

export default function ConnectionBadge({ isConnected, pingMs = 25 }) {
  const signalLevel = !isConnected ? 0 : pingMs < 70 ? 3 : pingMs < 160 ? 2 : 1;
  const signalColor = !isConnected ? '#EF4444' : signalLevel === 3 ? '#16A34A' : signalLevel === 2 ? '#D97706' : '#DC2626';

  return (
    <div
      className="connection-badge"
      title={isConnected ? `Tín hiệu mạng: ${signalLevel === 3 ? 'Rất tốt' : signalLevel === 2 ? 'Trung bình' : 'Chậm'} (${pingMs}ms)` : 'Mất kết nối'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: '#FFFFFF',
        border: '2px solid var(--comic-black)',
        boxShadow: '0 2px 0 var(--comic-black)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
        <span style={{ width: 3, height: 5, borderRadius: 1, background: signalLevel >= 1 ? signalColor : '#CBD5E1' }} />
        <span style={{ width: 3, height: 9, borderRadius: 1, background: signalLevel >= 2 ? signalColor : '#CBD5E1' }} />
        <span style={{ width: 3, height: 13, borderRadius: 1, background: signalLevel >= 3 ? signalColor : '#CBD5E1' }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 900, color: signalColor, fontFamily: 'var(--font-title)' }}>
        {isConnected ? (signalLevel === 3 ? 'Tốt' : `${pingMs}ms`) : 'Mất mạng'}
      </span>
    </div>
  );
}
