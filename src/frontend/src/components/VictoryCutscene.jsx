import React, { useState, useEffect, useRef } from 'react';
import { playVictory } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

export default function VictoryCutscene({ winner = 'A', onDone }) {
  const [canSkip, setCanSkip] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const isA = winner === 'A';
  const winnerName = isA ? 'ĐỘI A - TIA CHỚP' : 'ĐỘI B - NGỌN LỬA';
  const winnerColor = isA ? '#00F0FF' : '#FF6B00';
  const loserName = isA ? 'ĐỘI B - NGỌN LỬA' : 'ĐỘI A - TIA CHỚP';

  useEffect(() => {
    // Play celebratory victory fanfare
    playVictory();
    triggerHaptic([60, 40, 100, 50, 200]);

    // Show skip button after 1.5s
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, 1500);

    // Auto complete after 6.8s
    const doneTimer = setTimeout(() => {
      onDone();
    }, 6800);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(doneTimer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [onDone]);

  // Cinematic 6-second Canvas Cutscene (Storyboard: Tension -> Big Yank -> Slip & Tumble -> Victory Cheer)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let startTime = performance.now();

    // Generate confetti particles
    const confettiCount = 70;
    const confetti = Array.from({ length: confettiCount }).map(() => ({
      x: Math.random() * 600,
      y: Math.random() * -300,
      size: 5 + Math.random() * 6,
      color: ['#00F0FF', '#FF6B00', '#FFD600', '#00E676', '#FF1744', '#CDB9FF'][Math.floor(Math.random() * 6)],
      speedY: 2 + Math.random() * 4,
      speedX: (Math.random() - 0.5) * 3,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.1
    }));

    const render = (time) => {
      const elapsed = (time - startTime) / 1000; // in seconds
      ctx.clearRect(0, 0, 600, 600);

      // Dark Neon Grid Floor
      ctx.fillStyle = '#0B132B';
      ctx.fillRect(0, 0, 600, 600);

      // Perspective Grid Lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 600; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 400);
        ctx.lineTo(i * 1.4 - 120, 600);
        ctx.stroke();
      }

      // Laser Center Line
      ctx.strokeStyle = '#FF1744';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FF1744';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(300, 360);
      ctx.lineTo(300, 580);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Phase calculation (0-1s: Standoff; 1-2.5s: Hard Yank; 2.5-4s: Tumble; 4-6.8s: Confetti Cheer)
      let pullProgress = 0;
      if (elapsed > 1 && elapsed <= 2.5) {
        pullProgress = (elapsed - 1) / 1.5;
      } else if (elapsed > 2.5) {
        pullProgress = 1;
      }

      const ropeShift = (isA ? -1 : 1) * pullProgress * 140;

      // Draw Rope
      ctx.strokeStyle = '#D4A373';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(60 + (isA ? ropeShift * 0.4 : 0), 460);
      ctx.quadraticCurveTo(300 + ropeShift, 465 + (elapsed < 2.5 ? Math.sin(elapsed * 15) * 4 : 0), 540 + (!isA ? ropeShift * 0.4 : 0), 460);
      ctx.stroke();

      // Red Ribbon Knot
      const ribbonX = 300 + ropeShift;
      ctx.fillStyle = '#FF1744';
      ctx.shadowColor = '#FF1744';
      ctx.shadowBlur = 14;
      ctx.fillRect(ribbonX - 8, 442, 16, 26);
      ctx.shadowBlur = 0;

      // Winning Team (Lean back hard and cheer)
      const winX = isA ? 140 + ropeShift * 0.3 : 460 + ropeShift * 0.3;
      const winLean = isA ? -0.45 : 0.45;
      const isCheering = elapsed > 3.5;

      ctx.save();
      ctx.translate(winX, 450);
      ctx.rotate(isCheering ? (isA ? -0.1 : 0.1) : winLean);

      // Body
      ctx.fillStyle = winnerColor;
      ctx.shadowColor = winnerColor;
      ctx.shadowBlur = 10;
      ctx.fillRect(-14, -40, 28, 42);
      ctx.shadowBlur = 0;
      // Head
      ctx.fillStyle = '#1C2541';
      ctx.beginPath();
      ctx.arc(0, -56, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = winnerColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Arms (Cheering if > 3.5s)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 5;
      ctx.beginPath();
      if (isCheering) {
        ctx.moveTo(-12, -35); ctx.lineTo(-24, -75);
        ctx.moveTo(12, -35); ctx.lineTo(24, -75);
      } else {
        ctx.moveTo(-10, -30); ctx.lineTo(isA ? 15 : -15, -15);
      }
      ctx.stroke();
      ctx.restore();

      // Losing Team (Slips across line & falls over!)
      const loseX = isA ? 430 + ropeShift : 170 + ropeShift;
      const isFallen = elapsed > 2.8;
      const fallAngle = isA ? (Math.min(1.3, (elapsed - 2.5) * 1.5)) : -(Math.min(1.3, (elapsed - 2.5) * 1.5));

      ctx.save();
      ctx.translate(loseX, 470);
      ctx.rotate(isFallen ? fallAngle : (isA ? 0.3 : -0.3));

      // Loser Body
      ctx.fillStyle = isA ? '#FF6B00' : '#00F0FF';
      ctx.fillRect(-12, -38, 24, 38);
      // Loser Head
      ctx.fillStyle = '#1C2541';
      ctx.beginPath();
      ctx.arc(0, -52, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isA ? '#FF6B00' : '#00F0FF';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Confused Face 'X X'
      if (isFallen) {
        ctx.fillStyle = '#FF1744';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('X X', -8, -50);
      }
      ctx.restore();

      // Confetti Shower (Starts at 3.2s)
      if (elapsed > 3.2) {
        confetti.forEach(p => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();

          p.y += p.speedY;
          p.x += p.speedX;
          p.angle += p.spin;
          if (p.y > 600) p.y = -20;
        });
      }

      // Cinematic Text Overlay
      if (elapsed > 3.0) {
        ctx.save();
        ctx.textAlign = 'center';

        ctx.font = 'bold 22px "Baloo 2", sans-serif';
        ctx.fillStyle = '#FFD600';
        ctx.shadowColor = 'rgba(255, 214, 0, 0.8)';
        ctx.shadowBlur = 16;
        ctx.fillText('🏆 CHIẾN THẮNG TUYỆT ĐỐI 10 ĐIỂM! 🏆', 300, 140);

        ctx.font = '900 36px "Baloo 2", sans-serif';
        ctx.fillStyle = winnerColor;
        ctx.shadowColor = winnerColor;
        ctx.shadowBlur = 24;
        ctx.fillText(`${winnerName} VÔ ĐỊCH!`, 300, 195);
        ctx.shadowBlur = 0;

        ctx.font = '600 15px "Be Vietnam Pro", sans-serif';
        ctx.fillStyle = '#E2E8F0';
        ctx.fillText(`Tuyệt vời! ${loserName} đã thi đấu vô cùng kiên cường!`, 300, 235);
        ctx.restore();
      }

      if (elapsed < 6.8) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);
  }, [winner, isA, winnerColor, winnerName, loserName]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0B132B',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      {/* Fallback & Custom Video check */}
      <video
        src={`/assets/video/win_${isA ? 'team_a' : 'team_b'}.mp4`}
        poster={`/assets/video/win_${isA ? 'team_a' : 'team_b'}.webp`}
        muted
        playsInline
        autoPlay
        onError={() => setVideoError(true)}
        style={{
          display: videoError ? 'none' : 'block',
          width: '100%',
          maxWidth: 540,
          aspectRatio: '1/1',
          borderRadius: 20,
          border: `2px solid ${winnerColor}`,
          boxShadow: `0 0 30px ${winnerColor}`
        }}
      />

      {/* Cinematic 60FPS Canvas Cutscene (Displays when video file is not present or as primary animation) */}
      <div
        style={{
          display: videoError ? 'block' : 'none',
          position: 'relative',
          width: '100%',
          maxWidth: 540,
          aspectRatio: '1/1',
          borderRadius: 20,
          overflow: 'hidden',
          border: `2px solid ${winnerColor}`,
          boxShadow: `0 0 35px ${winnerColor}`
        }}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Skip Button */}
      {canSkip && (
        <button
          onClick={onDone}
          className="btn-tactile"
          style={{
            marginTop: 18,
            padding: '10px 24px',
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1.5px solid rgba(255, 255, 255, 0.3)',
            color: '#FFFFFF',
            fontSize: '0.9rem',
            fontWeight: 800,
            borderRadius: 14,
            cursor: 'pointer'
          }}
        >
          Bỏ qua Cutscene ⏩
        </button>
      )}
    </div>
  );
}
