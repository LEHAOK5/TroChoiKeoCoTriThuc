import React from 'react';

export default function ConnectionBadge({ isConnected, pingMs = 25 }) {
  const signalLevel = !isConnected ? 0 : pingMs < 70 ? 3 : pingMs < 160 ? 2 : 1;
  const signalColor = !isConnected ? '#FF1744' : signalLevel === 3 ? '#00E676' : signalLevel === 2 ? '#FFAB00' : '#FF5252';

  return (
    <div
      className="connection-badge"
      title={isConnected ? `Tín hiệu mạng: ${signalLevel === 3 ? 'Rất tốt' : signalLevel === 2 ? 'Trung bình' : 'Chậm'} (${pingMs}ms)` : 'Mất kết nối'}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
        <span style={{ width: 3, height: 5, borderRadius: 1, background: signalLevel >= 1 ? signalColor : 'rgba(255,255,255,0.2)' }} />
        <span style={{ width: 3, height: 9, borderRadius: 1, background: signalLevel >= 2 ? signalColor : 'rgba(255,255,255,0.2)' }} />
        <span style={{ width: 3, height: 13, borderRadius: 1, background: signalLevel >= 3 ? signalColor : 'rgba(255,255,255,0.2)' }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: signalColor }}>
        {isConnected ? (signalLevel === 3 ? 'Tốt' : `${pingMs}ms`) : 'Mất mạng'}
      </span>
    </div>
  );
}

