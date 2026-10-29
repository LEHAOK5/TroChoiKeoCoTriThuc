import React, { useEffect, useRef } from 'react';
import PullerCharacter from './PullerCharacter';
import RefereeCharacter from './RefereeCharacter';
import CrowdCheer from './CrowdCheer';
import { Juice } from '../utils/juice';
import vhuLogo from '../img/Logo VHU.png';

export default function TugOfWarArena({
  scoreA = 0,
  scoreB = 0,
  ropeOffset = 0,
  winner = null,
  teamACount = 5,
  teamBCount = 5,
  lastResult = null,
  isBuzzed = false,
  activeCardEffects = {},
  tacticalCards = { A: {}, B: {} }
}) {
  // ropeOffset ranges from -10 (Team A pull max) to +10 (Team B pull max)
  const isMatchPoint = (scoreA === 9 || scoreB === 9) && !winner;
  const matchPointTeam = scoreA === 9 ? 'A' : scoreB === 9 ? 'B' : null;

  const prevScoreARef = useRef(scoreA);
  const prevScoreBRef = useRef(scoreB);

  const isACheering = scoreA > prevScoreARef.current;
  const isBCheering = scoreB > prevScoreBRef.current;

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

  // Trạng thái kéo giật dây chủ động (2.5s) khi có đội ghi điểm thành công
  const [activePullTeam, setActivePullTeam] = React.useState(null);

  useEffect(() => {
    if (lastResult?.isCorrect && lastResult?.answeringTeam) {
      setActivePullTeam(lastResult.answeringTeam);
      const timer = setTimeout(() => {
        setActivePullTeam(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [lastResult]);

  // Đội chủ động kéo: khi vừa ghi điểm (activePullTeam) HOẶC khi đang dẫn điểm
  const isAPulling = activePullTeam === 'A' || (ropeOffset < 0 && !activePullTeam);
  const isBPulling = activePullTeam === 'B' || (ropeOffset > 0 && !activePullTeam);

  // Tính trạng thái tiếc nuối khi đội nhà sai hoặc đối thủ kéo mạnh
  const isAWrong = Boolean(lastResult && !lastResult.isCorrect && (lastResult.answeringTeam === 'A' || lastResult.failedTeam === 'A' || lastResult.reason === 'BOTH_INCORRECT'));
  const isBWrong = Boolean(lastResult && !lastResult.isCorrect && (lastResult.answeringTeam === 'B' || lastResult.failedTeam === 'B' || lastResult.reason === 'BOTH_INCORRECT'));

  const isADismayed = isAWrong || isBPulling;
  const isBDismayed = isBWrong || isAPulling;

  // Đội hình kéo co: Luôn giữ nguyên 5 nhân vật Chibi mỗi bên (10 Chibi) y cũ để tạo không khí náo nhiệt
  const teamAIndices = [4, 3, 2, 1, 0];
  const teamBIndices = [0, 1, 2, 3, 4];

  // Mobile detection for dynamic compact responsive scaling
  const [isMobile, setIsMobile] = React.useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lực giật động lực học (Impulse) khi vừa ghi điểm thành công
  const impulseShift = activePullTeam === 'A' ? (isMobile ? -8 : -14) : activePullTeam === 'B' ? (isMobile ? 8 : 14) : 0;

  // Độ dịch chuyển nơ cờ đỏ và sợi dây:
  // Mỗi điểm chênh lệch sẽ kéo nơ dịch chuyển rõ rệt tối thiểu 6.5px (mobile) hoặc 13px (desktop)
  // Kết hợp lực giật impulse khi vừa ghi điểm để tạo hiệu ứng kéo giật dây tức thì
  const baseStepPx = isMobile ? 6.5 : 13;
  const maxRibbonShift = isMobile ? 55 : 110;
  const ribbonShiftPx = Math.max(-maxRibbonShift, Math.min(maxRibbonShift, (ropeOffset * baseStepPx) + impulseShift));

  // Độ dịch chuyển đội hình kéo co: Giữ trong giới hạn an toàn để không tràn mép sân đấu
  const maxPullerShift = isMobile ? 20 : 42;
  const pullerShiftPx = Math.max(-maxPullerShift, Math.min(maxPullerShift, (ropeOffset / 10) * maxPullerShift + (impulseShift * 0.35)));

  // Khoảng cách từ vạch giữa (50%) đến người Tiên phong (#1) của mỗi đội
  const leaderGap = isMobile ? 22 : 36;
  const pullerOverlap = isMobile ? -25 : -17;
  const pullerScale = isMobile ? 0.68 : 1;

  return (
    <div className="arena-tier">
      <div className={`arena-card ${isMatchPoint ? 'rebound-active-border' : ''}`}>
        {/* Match Point Alert Banner */}
        {isMatchPoint && (
          <div className="match-point-banner" style={{ marginBottom: 8 }}>
            🔥 <strong>ĐIỂM QUYẾT ĐỊNH!</strong> ĐỘI {matchPointTeam === 'A' ? 'A (TIA CHỚP)' : 'B (NGỌN LỬA)'} CHỈ CẦN THÊM 1 ĐIỂM ĐỂ VÔ ĐỊCH!
          </div>
        )}

        {/* Scoreboard Row (Giao diện bảng điểm sạch, tinh tế, bỏ chữ 5 sinh viên VHU) */}
        <div className="score-row">
          {/* Team A Badge */}
          <div className="team-badge" style={{ flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10 }}>
              <div className="team-avatar team-a" style={{ width: isMobile ? 34 : 44, height: isMobile ? 34 : 44, fontSize: isMobile ? '1.1rem' : '1.4rem' }}>
                <span>⚡</span>
              </div>
              <div>
                <div className="team-title" style={{ color: '#1A1AFF', fontSize: isMobile ? '0.78rem' : '0.95rem' }}>
                  {isMobile ? 'ĐỘI A' : 'ĐỘI A - VHU TIA CHỚP'}
                </div>
              </div>
              <div className="score-display team-a" style={{ marginLeft: isMobile ? 4 : 6, fontSize: isMobile ? '1.6rem' : '2.2rem' }}>
                {scoreA}
              </div>
            </div>
            {/* 10-Notch Energy Bar for Team A */}
            <div className="notch-bar" style={{ gap: isMobile ? 2 : 3 }}>
              {Array.from({ length: 10 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`notch-seg ${idx < scoreA ? 'active-a' : ''}`}
                  style={{ height: isMobile ? 5 : 7 }}
                />
              ))}
            </div>

            {/* Tactical Cards Status HUD for Team A */}
            <div style={{ display: 'flex', gap: isMobile ? 2 : 4, marginTop: 4, flexWrap: 'wrap' }}>
              {[
                { key: 'FIREWALL', icon: '🛡️', label: 'Tường Lửa' },
                { key: 'DDOS', icon: '❄️', label: 'DDoS' },
                { key: 'DOUBLE_PULL', icon: '⚖️', label: 'X2 Kéo' },
                { key: 'FIFTY_FIFTY', icon: '🎯', label: '50/50' }
              ].map(c => {
                const isUsed = Boolean(tacticalCards?.A?.[c.key]);
                return (
                  <span
                    key={c.key}
                    title={`Đội A: Thẻ ${c.label} (${isUsed ? 'Đã sử dụng' : 'Khả dụng'})`}
                    style={{
                      background: isUsed ? '#F1F5F9' : '#E0F2FE',
                      color: isUsed ? '#94A3B8' : '#0369A1',
                      border: `1.5px solid ${isUsed ? '#CBD5E1' : '#0284C7'}`,
                      borderRadius: 6,
                      padding: isMobile ? '1px 3px' : '1px 5px',
                      fontSize: isMobile ? '0.62rem' : '0.72rem',
                      fontWeight: 900,
                      opacity: isUsed ? 0.45 : 1,
                      filter: isUsed ? 'grayscale(1)' : 'none',
                      textDecoration: isUsed ? 'line-through' : 'none',
                      boxShadow: isUsed ? 'none' : '0 1px 0 var(--comic-black)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {c.icon} {c.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Center Boundary VS Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: isMobile ? '0 4px' : '0 8px' }}>
            <div className="vs-pill" style={{ fontSize: isMobile ? '0.7rem' : '0.78rem', padding: isMobile ? '2px 8px' : '4px 10px' }}>
              RANH GIỚI
            </div>
            <span style={{ fontSize: isMobile ? '0.62rem' : '0.68rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: 2 }}>
              10đ
            </span>
          </div>

          {/* Team B Badge */}
          <div className="team-badge" style={{ flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, flexDirection: 'row-reverse' }}>
              <div className="team-avatar team-b" style={{ width: isMobile ? 34 : 44, height: isMobile ? 34 : 44, fontSize: isMobile ? '1.1rem' : '1.4rem' }}>
                <span>🔥</span>
              </div>
              <div>
                <div className="team-title" style={{ color: '#EA580C', fontSize: isMobile ? '0.78rem' : '0.95rem' }}>
                  {isMobile ? 'ĐỘI B' : 'ĐỘI B - VHU NGỌN LỬA'}
                </div>
              </div>
              <div className="score-display team-b" style={{ marginRight: isMobile ? 4 : 6, fontSize: isMobile ? '1.6rem' : '2.2rem' }}>
                {scoreB}
              </div>
            </div>
            {/* 10-Notch Energy Bar for Team B */}
            <div className="notch-bar" style={{ flexDirection: 'row-reverse', gap: isMobile ? 2 : 3 }}>
              {Array.from({ length: 10 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`notch-seg ${idx < scoreB ? 'active-b' : ''}`}
                  style={{ height: isMobile ? 5 : 7 }}
                />
              ))}
            </div>

            {/* Tactical Cards Status HUD for Team B */}
            <div style={{ display: 'flex', gap: isMobile ? 2 : 4, marginTop: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {[
                { key: 'FIREWALL', icon: '🛡️', label: 'Tường Lửa' },
                { key: 'DDOS', icon: '❄️', label: 'DDoS' },
                { key: 'DOUBLE_PULL', icon: '⚖️', label: 'X2 Kéo' },
                { key: 'FIFTY_FIFTY', icon: '🎯', label: '50/50' }
              ].map(c => {
                const isUsed = Boolean(tacticalCards?.B?.[c.key]);
                return (
                  <span
                    key={c.key}
                    title={`Đội B: Thẻ ${c.label} (${isUsed ? 'Đã sử dụng' : 'Khả dụng'})`}
                    style={{
                      background: isUsed ? '#F1F5F9' : '#FFEDD5',
                      color: isUsed ? '#94A3B8' : '#C2410C',
                      border: `1.5px solid ${isUsed ? '#CBD5E1' : '#EA580C'}`,
                      borderRadius: 6,
                      padding: isMobile ? '1px 3px' : '1px 5px',
                      fontSize: isMobile ? '0.62rem' : '0.72rem',
                      fontWeight: 900,
                      opacity: isUsed ? 0.45 : 1,
                      filter: isUsed ? 'grayscale(1)' : 'none',
                      textDecoration: isUsed ? 'line-through' : 'none',
                      boxShadow: isUsed ? 'none' : '0 1px 0 var(--comic-black)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {c.icon} {c.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2D Stadium Tug of War Arena Stage (Cao 138px chuẩn Chibi 5vs5) */}
        <div className="rope-stage">
          {/* Spectator Stands Layer (Top 36% floor) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '36%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              zIndex: 2,
              paddingBottom: 2
            }}
          >
            {/* Team A Cheering Audience (Left Stand) */}
            <CrowdCheer
              team="A"
              isCheering={isACheering || isAPulling}
              isDismayed={isADismayed}
              isBuzzed={isBuzzed}
            />

            {/* Center Campus Tournament Sign with Official VHU Logo */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1.5px solid #0F172A',
                borderRadius: 8,
                padding: isMobile ? '2px 6px' : '3px 10px',
                fontSize: isMobile ? '9px' : '10px',
                fontWeight: 900,
                fontFamily: 'var(--font-title)',
                color: '#1A1AFF',
                boxShadow: '0 2px 0 #0F172A',
                letterSpacing: '0.3px',
                whiteSpace: 'nowrap',
                marginBottom: 2,
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 4 : 6,
                flexShrink: 0,
                zIndex: 3
              }}
            >
              <img
                src={vhuLogo}
                alt="VHU Logo"
                style={{ width: isMobile ? 13 : 16, height: isMobile ? 13 : 16, objectFit: 'contain' }}
              />
              <span>{isMobile ? 'NGÀY HỘI SINH VIÊN' : 'NGÀY HỘI SINH VIÊN VĂN HIẾN'}</span>
            </div>

            {/* Team B Cheering Audience (Right Stand) */}
            <CrowdCheer
              team="B"
              isCheering={isBCheering || isBPulling}
              isDismayed={isBDismayed}
              isBuzzed={isBuzzed}
            />
          </div>

          {/* 🦹‍♂️ Cute Chibi Referee Character right in the middle */}
          <RefereeCharacter
            ropeOffset={ropeOffset}
            lastResult={lastResult}
            isBuzzed={isBuzzed}
            winner={winner}
          />

          {/* Center Red/White Stadium Boundary Line */}
          <div className="center-line" />

          {/* Comic Action Popups when pulling */}
          {isAPulling && (
            <div
              style={{
                position: 'absolute',
                left: '20%',
                bottom: '72px',
                background: '#1A1AFF',
                color: '#FFFFFF',
                border: '2px solid #0F172A',
                borderRadius: 8,
                padding: '3px 9px',
                fontSize: '11px',
                fontWeight: 900,
                fontFamily: 'var(--font-title)',
                boxShadow: '0 2px 0 #0F172A',
                zIndex: 14,
                transform: 'rotate(-5deg)',
                animation: 'bounceIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              ⚡ DÔ TA! KÉO!
            </div>
          )}

          {isBPulling && (
            <div
              style={{
                position: 'absolute',
                right: '20%',
                bottom: '72px',
                background: '#EA580C',
                color: '#FFFFFF',
                border: '2px solid #0F172A',
                borderRadius: 8,
                padding: '3px 9px',
                fontSize: '11px',
                fontWeight: 900,
                fontFamily: 'var(--font-title)',
                boxShadow: '0 2px 0 #0F172A',
                zIndex: 14,
                transform: 'rotate(5deg)',
                animation: 'bounceIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              🔥 GỒNG LÊN! KÉO!
            </div>
          )}

          {/* Thick Cartoon Braided Rope passing right through Chibi hands */}
          <div
            className="rope-line"
            style={{
              transform: `translateX(${ribbonShiftPx}px)`
            }}
          />

          {/* Red Ribbon Knot with Flag */}
          <div
            className="ribbon-knot"
            style={{
              left: `calc(50% + ${ribbonShiftPx}px)`
            }}
          >
            {/* Double Pull Badge */}
            {activeCardEffects.doublePullTeam && (
              <div style={{
                position: 'absolute',
                top: -30,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#FEF08A',
                border: '2px solid #854D0E',
                borderRadius: 8,
                padding: '2px 8px',
                fontSize: '0.72rem',
                fontWeight: 900,
                color: '#713F12',
                boxShadow: '0 2px 0 #854D0E, 0 0 10px rgba(234, 179, 8, 0.6)',
                whiteSpace: 'nowrap',
                animation: 'bounce 0.6s infinite alternate',
                zIndex: 20
              }}>
                ⚡⚖️ X2 LỰC KÉO!
              </div>
            )}
          </div>

          {/* ⚡ TEAM A: 5 BẠN CHIBI VHU (3 NAM, 2 NỮ) ⚡ */}
          <div
            className="team-pullers-container team-a-pullers"
            style={{
              position: 'absolute',
              right: `calc(50% + ${leaderGap}px)`,
              bottom: 6,
              display: 'flex',
              alignItems: 'flex-end',
              zIndex: 8,
              transform: `translateX(${pullerShiftPx}px) scale(${pullerScale})`,
              transformOrigin: 'bottom right',
              transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Firewall Blue Hexagonal Shield Effect */}
            {activeCardEffects.firewallTeam === 'A' && (
              <div style={{
                position: 'absolute',
                inset: -6,
                borderRadius: 14,
                border: '2px solid #38BDF8',
                background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(37, 99, 235, 0.08) 100%)',
                boxShadow: '0 0 14px #38BDF8',
                pointerEvents: 'none',
                zIndex: 25
              }}>
                <span style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: '0.68rem', background: '#0284C7', color: '#FFF', padding: '1px 6px', borderRadius: 5, fontWeight: 900, whiteSpace: 'nowrap' }}>
                  🛡️ TƯỜNG LỬA
                </span>
              </div>
            )}

            {/* DDoS Freeze Speech Bubble */}
            {activeCardEffects.frozenTeam === 'A' && (
              <div style={{
                position: 'absolute',
                top: -24,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#BAE6FD',
                border: '1.5px solid #0284C7',
                color: '#0369A1',
                borderRadius: 8,
                padding: '2px 8px',
                fontSize: '0.68rem',
                fontWeight: 900,
                whiteSpace: 'nowrap',
                zIndex: 25,
                boxShadow: '0 2px 0 #0284C7',
                animation: 'shake 0.3s infinite alternate'
              }}>
                🥶 Bị DDoS lag quá!
              </div>
            )}

            {/* Dust cloud when Team A is actively pulling */}
            {isAPulling && (
              <span
                style={{
                  fontSize: '20px',
                  marginRight: -8,
                  animation: 'sweatDrip 0.5s infinite',
                  zIndex: 12
                }}
              >
                💨
              </span>
            )}
            {teamAIndices.map((origIdx, renderIdx) => (
              <div
                key={`a-pos-${origIdx}`}
                style={{
                  marginRight: renderIdx === (teamAIndices.length - 1) ? 0 : pullerOverlap,
                  zIndex: renderIdx + 1
                }}
              >
                <PullerCharacter
                  team="A"
                  index={origIdx}
                  isPulling={isAPulling}
                  isFallen={winner === 'B'}
                />
              </div>
            ))}
          </div>

          {/* 🔥 TEAM B: 5 BẠN CHIBI VHU (3 NAM, 2 NỮ) 🔥 */}
          <div
            className="team-pullers-container team-b-pullers"
            style={{
              position: 'absolute',
              left: `calc(50% + ${leaderGap}px)`,
              bottom: 6,
              display: 'flex',
              alignItems: 'flex-end',
              zIndex: 8,
              transform: `translateX(${pullerShiftPx}px) scale(${pullerScale})`,
              transformOrigin: 'bottom left',
              transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Firewall Blue Hexagonal Shield Effect */}
            {activeCardEffects.firewallTeam === 'B' && (
              <div style={{
                position: 'absolute',
                inset: -6,
                borderRadius: 14,
                border: '2px solid #38BDF8',
                background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(37, 99, 235, 0.08) 100%)',
                boxShadow: '0 0 14px #38BDF8',
                pointerEvents: 'none',
                zIndex: 25
              }}>
                <span style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: '0.68rem', background: '#0284C7', color: '#FFF', padding: '1px 6px', borderRadius: 5, fontWeight: 900, whiteSpace: 'nowrap' }}>
                  🛡️ TƯỜNG LỬA
                </span>
              </div>
            )}

            {/* DDoS Freeze Speech Bubble */}
            {activeCardEffects.frozenTeam === 'B' && (
              <div style={{
                position: 'absolute',
                top: -24,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#BAE6FD',
                border: '1.5px solid #0284C7',
                color: '#0369A1',
                borderRadius: 8,
                padding: '2px 8px',
                fontSize: '0.68rem',
                fontWeight: 900,
                whiteSpace: 'nowrap',
                zIndex: 25,
                boxShadow: '0 2px 0 #0284C7',
                animation: 'shake 0.3s infinite alternate'
              }}>
                🥶 Bị DDoS lag quá!
              </div>
            )}
            {teamBIndices.map((origIdx, renderIdx) => (
              <div
                key={`b-pos-${origIdx}`}
                style={{
                  marginLeft: renderIdx === 0 ? 0 : pullerOverlap,
                  zIndex: 5 - renderIdx
                }}
              >
                <PullerCharacter
                  team="B"
                  index={origIdx}
                  isPulling={isBPulling}
                  isFallen={winner === 'A'}
                />
              </div>
            ))}
            {/* Dust cloud when Team B is actively pulling */}
            {isBPulling && (
              <span
                style={{
                  fontSize: '20px',
                  marginLeft: -8,
                  animation: 'sweatDrip 0.5s infinite',
                  zIndex: 12
                }}
              >
                💨
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
