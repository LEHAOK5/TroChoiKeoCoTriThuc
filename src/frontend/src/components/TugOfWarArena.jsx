import React, { useEffect, useRef } from 'react';
import PullerCharacter from './PullerCharacter';
import { Juice } from '../utils/juice';

export default function TugOfWarArena({ scoreA = 0, scoreB = 0, ropeOffset = 0, winner = null, teamACount = 2, teamBCount = 2 }) {
  // ropeOffset ranges from -10 (Team A pull max) to +10 (Team B pull max)
  const ribbonPercent = 50 + (ropeOffset / 10) * 35;
  const isMatchPoint = (scoreA === 9 || scoreB === 9) && !winner;
  const matchPointTeam = scoreA === 9 ? 'A' : scoreB === 9 ? 'B' : null;

  const prevScoreARef = useRef(scoreA);
  const prevScoreBRef = useRef(scoreB);

  useEffect(() => {
    if (scoreA > prevScoreARef.current) {
      Juice.onCorrect('A');
    }
    prevScoreARef.current = scoreA;
  }, [scoreA]);

  useEffect(() => {
    if (scoreB > prevScoreBRef.current) {
      Juice.onCorrect('B');
    }
    prevScoreBRef.current = scoreB;
  }, [scoreB]);

  useEffect(() => {
    if (isMatchPoint) {
      Juice.onMatchPoint();
    }
  }, [isMatchPoint]);

  // Number of characters to display (between 1 and 4)
  const countA = Math.max(1, Math.min(4, teamACount || 2));
  const countB = Math.max(1, Math.min(4, teamBCount || 2));

  return (
    <div className="arena-tier">
      <div className={`arena-card ${isMatchPoint ? 'rebound-active-border' : ''}`} style={{ boxShadow: 'var(--elev-2)' }}>
        {/* Match Point Alert Banner */}
        {isMatchPoint && (
          <div className="match-point-banner" style={{ marginBottom: 10 }}>
            🔥 MATCH POINT! ĐỘI {matchPointTeam === 'A' ? 'A (TIA CHỚP)' : 'B (NGỌN LỬA)'} CHỈ CẦN 1 ĐIỂM NỮA ĐỂ VÔ ĐỊCH!
          </div>
        )}

        {/* Scoreboard Row */}
        <div className="score-row">
          {/* Team A Badge */}
          <div className="team-badge" style={{ flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="team-avatar team-a">⚡</div>
              <div>
                <div className="team-title" style={{ color: 'var(--team-a-cyan)', fontSize: '0.92rem' }}>ĐỘI A - TIA CHỚP</div>
                <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Mục tiêu 10 điểm</small>
              </div>
              <div className="score-display team-a" style={{ marginLeft: 6 }}>{scoreA}</div>
            </div>
            {/* 10-Notch Progress Bar for Team A */}
            <div className="notch-bar">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`notch-seg ${idx < scoreA ? 'active-a' : ''}`}
                />
              ))}
            </div>
          </div>

          <div className="vs-pill" style={{ margin: '0 10px', fontSize: '0.75rem', letterSpacing: 1 }}>
            RANH GIỚI
          </div>

          {/* Team B Badge */}
          <div className="team-badge" style={{ flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: 'row-reverse' }}>
              <div className="team-avatar team-b">🔥</div>
              <div>
                <div className="team-title" style={{ color: 'var(--team-b-orange)', fontSize: '0.92rem' }}>ĐỘI B - NGỌN LỬA</div>
                <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Mục tiêu 10 điểm</small>
              </div>
              <div className="score-display team-b" style={{ marginRight: 6 }}>{scoreB}</div>
            </div>
            {/* 10-Notch Progress Bar for Team B */}
            <div className="notch-bar" style={{ flexDirection: 'row-reverse' }}>
              {Array.from({ length: 10 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`notch-seg ${idx < scoreB ? 'active-b' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Rope Stage */}
        <div className="rope-stage" style={{ height: 68, marginTop: 4 }}>
          {/* Laser Center Line */}
          <div className="center-line" style={{ background: '#FF1744', boxShadow: '0 0 10px #FF1744' }} />

          {/* Team A Pullers (SVG Vector Characters) */}
          <div
            className="puller-team left"
            style={{
              display: 'flex',
              gap: 4,
              transform: `translateY(-50%) translateX(${ropeOffset * -5}px)`,
              transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {Array.from({ length: countA }).map((_, i) => (
              <PullerCharacter
                key={i}
                team="A"
                index={i}
                isPulling={scoreA > scoreB}
                isFallen={winner === 'B'}
              />
            ))}
          </div>

          {/* Elastic Rope Track */}
          <div
            className="rope-line"
            style={{
              background: 'repeating-linear-gradient(45deg, #D4A373, #D4A373 6px, #BC6C25 6px, #BC6C25 12px)',
              height: 10,
              borderRadius: 5,
              boxShadow: '0 3px 6px rgba(0,0,0,0.6)',
              transform: `translateX(${(ropeOffset / 10) * 22}px)`,
              transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Red Ribbon Knot with Glowing Flag */}
            <div
              className="ribbon-knot"
              style={{
                left: `${ribbonPercent}%`,
                width: 22,
                height: 32,
                background: 'linear-gradient(180deg, #FF1744 0%, #D50000 100%)',
                border: '2px solid #FFFFFF',
                borderRadius: 4,
                boxShadow: '0 0 16px #FF1744'
              }}
            />
          </div>

          {/* Team B Pullers (SVG Vector Characters) */}
          <div
            className="puller-team right"
            style={{
              display: 'flex',
              flexDirection: 'row-reverse',
              gap: 4,
              transform: `translateY(-50%) translateX(${ropeOffset * -5}px)`,
              transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {Array.from({ length: countB }).map((_, i) => (
              <PullerCharacter
                key={i}
                team="B"
                index={i}
                isPulling={scoreB > scoreA}
                isFallen={winner === 'A'}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
