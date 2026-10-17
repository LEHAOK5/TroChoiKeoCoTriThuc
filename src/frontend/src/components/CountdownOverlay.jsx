import React from 'react';

export default function CountdownOverlay({ seconds }) {
  if (seconds === null || seconds === undefined) return null;

  return (
    <div className="overlay-backdrop">
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontFamily: 'var(--font-title)', fontWeight: 700, marginBottom: 10 }}>
          TRẬN ĐẤU BẮT ĐẦU TRONG
        </p>
        <div className="countdown-giant">
          {seconds > 0 ? seconds : 'CHIẾN!'}
        </div>
      </div>
    </div>
  );
}
