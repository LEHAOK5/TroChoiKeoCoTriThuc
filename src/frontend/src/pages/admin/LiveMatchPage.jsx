import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../../services/socket';
import { getAdminRooms } from '../../services/api';
import TugOfWarArena from '../../components/TugOfWarArena';
import RingTimer from '../../components/RingTimer';
import VictoryCutscene from '../../components/VictoryCutscene';
import CountdownOverlay from '../../components/CountdownOverlay';
import vhuLogo from '../../img/Logo VHU.png';
import {
  playBuzzer,
  playCorrect,
  playWrong,
  playRopePull,
  playVictory,
  playCountdown,
  playShieldUp,
  playFreezeSfx,
  playDoubleGavel,
  playFiftyFiftyDismiss,
  isMuted,
  toggleMute,
  subscribeMute,
  unlockAudio
} from '../../utils/audio';
import {
  announceBuzzer,
  announceCorrect,
  announceWrong,
  announceRebound,
  announceVictory
} from '../../utils/announcer';

const OPTION_PREFIXES = ['A', 'B', 'C', 'D'];

export default function LiveMatchPage({
  initialRoomCode = ''
}) {
  const [token] = useState(() => sessionStorage.getItem('adminToken') || '');
  const [rooms, setRooms] = useState([]);
  const [selectedRoomCode, setSelectedRoomCode] = useState(() => {
    if (initialRoomCode) return initialRoomCode;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tv') || urlParams.get('spectate') || urlParams.get('room') || '';
  });

  const [autoFollow, setAutoFollow] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioMuted, setAudioMuted] = useState(() => isMuted());

  // Room Match States
  const [roomState, setRoomState] = useState(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [ropeOffset, setRopeOffset] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [deadline, setDeadline] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [uiState, setUiState] = useState('LOBBY'); // 'LOBBY' | 'COUNTDOWN' | 'ROUND_BUZZ' | 'BUZZER_AWARDED' | 'REBOUND' | 'ANSWER_RESULT' | 'FINISHED'
  const [buzzerWinner, setBuzzerWinner] = useState(null);
  const [reboundData, setReboundData] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [showCutscene, setShowCutscene] = useState(false);

  // Tactical card states
  const [tacticalCards, setTacticalCards] = useState({ A: {}, B: {} });
  const [activeCardEffects, setActiveCardEffects] = useState({});
  const [fiftyFiftyEliminated, setFiftyFiftyEliminated] = useState([]);

  // Subscribe to audio mute changes
  useEffect(() => {
    const unsub = subscribeMute((val) => setAudioMuted(val));
    return () => unsub();
  }, []);

  // Fetch rooms list periodically
  const fetchRooms = async () => {
    try {
      const res = await getAdminRooms(token);
      if (res?.success && Array.isArray(res.rooms)) {
        setRooms(res.rooms);
        // Auto-select room if none selected, or auto-follow active match
        if (!selectedRoomCode && res.rooms.length > 0) {
          const playingRoom = res.rooms.find(r => r.state === 'ROUND_BUZZ' || r.state === 'ROUND_ANSWER' || r.state === 'ROUND_REBOUND') || res.rooms[0];
          setSelectedRoomCode(playingRoom.roomCode);
        } else if (autoFollow && res.rooms.length > 0) {
          const activePlaying = res.rooms.find(r => r.state === 'ROUND_BUZZ' || r.state === 'ROUND_ANSWER' || r.state === 'ROUND_REBOUND');
          if (activePlaying && activePlaying.roomCode !== selectedRoomCode) {
            setSelectedRoomCode(activePlaying.roomCode);
          }
        }
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách phòng:', err);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, [token, autoFollow, selectedRoomCode]);

  // Connect socket as spectator when selectedRoomCode changes
  useEffect(() => {
    if (!selectedRoomCode) return;

    if (!socket.connected) {
      socket.connect();
    }

    // Join spectator
    socket.emit('joinSpectator', { roomCode: selectedRoomCode });

    const handleSpectatorSnapshot = (data) => {
      console.log('📺 [Spectator Snapshot Received]:', data);
      setRoomState({
        mode: data.mode,
        maxPerTeam: data.maxPerTeam,
        state: data.state,
        teamA: data.teamA || [],
        teamB: data.teamB || []
      });
      setScoreA(data.scoreA || 0);
      setScoreB(data.scoreB || 0);
      setRopeOffset(data.ropeOffset || 0);
      setTacticalCards(data.tacticalCards || { A: {}, B: {} });
      setActiveCardEffects(data.activeCardEffects || {});
      setBuzzerWinner(data.buzzerWinner || null);
      setReboundData(data.reboundData || null);

      if (data.currentQuestion && (data.state === 'ROUND_BUZZ' || data.state === 'ROUND_ANSWER' || data.state === 'ROUND_REBOUND')) {
        setCurrentQuestion(data.currentQuestion);
        setDeadline(data.deadline || null);
        if (data.state === 'ROUND_BUZZ') setUiState('ROUND_BUZZ');
        else if (data.state === 'ROUND_ANSWER') setUiState('BUZZER_AWARDED');
        else if (data.state === 'ROUND_REBOUND') setUiState('REBOUND');
      } else if (data.state === 'LOBBY') {
        setUiState('LOBBY');
        setCurrentQuestion(null);
        setGameOverData(null);
        setShowCutscene(false);
      } else if (data.state === 'FINISHED') {
        setUiState('FINISHED');
      }
    };

    const handleRoomStateUpdate = (data) => {
      if (data.roomCode && data.roomCode !== selectedRoomCode) return;
      setRoomState(data);
      if (typeof data.scoreA === 'number') setScoreA(data.scoreA);
      if (typeof data.scoreB === 'number') setScoreB(data.scoreB);
      if (typeof data.ropeOffset === 'number') setRopeOffset(data.ropeOffset);
      if (data.tacticalCards) setTacticalCards(data.tacticalCards);

      // Auto-reset when room returns to LOBBY
      if (data.state === 'LOBBY') {
        setUiState('LOBBY');
        setCurrentQuestion(null);
        setBuzzerWinner(null);
        setReboundData(null);
        setLastResult(null);
        setFiftyFiftyEliminated([]);
        setGameOverData(null);
        setShowCutscene(false);
      }
    };

    const handleStartCountdown = (data) => {
      const sec = typeof data.seconds === 'number' ? data.seconds : 3;
      setCountdown(sec);
      setUiState('COUNTDOWN');
      if (sec > 0) {
        playCountdown(sec);
      }
      if (sec === 0) {
        setTimeout(() => setCountdown(null), 1200);
      }
    };

    const handleNewQuestion = (data) => {
      console.log('📺 [New Question Live]:', data);
      setCountdown(null);
      setCurrentQuestion(data.question);
      setDeadline(data.deadline || Date.now() + 15000);
      setUiState('ROUND_BUZZ');
      setBuzzerWinner(null);
      setReboundData(null);
      setLastResult(null);
      setFiftyFiftyEliminated([]);
      if (typeof data.scoreA === 'number') setScoreA(data.scoreA);
      if (typeof data.scoreB === 'number') setScoreB(data.scoreB);
      if (typeof data.ropeOffset === 'number') setRopeOffset(data.ropeOffset);
    };

    const handleBuzzerAwarded = (data) => {
      console.log('⚡ [Buzzer Awarded Live]:', data);
      setBuzzerWinner(data);
      setDeadline(data.deadline || Date.now() + 10000);
      setUiState('BUZZER_AWARDED');
      playBuzzer();
      announceBuzzer(data.team, data.playerName);
    };

    const handleAnswerResult = (data) => {
      console.log('🎯 [Answer Result Live]:', data);
      setLastResult(data);
      setUiState('ANSWER_RESULT');
      if (typeof data.scoreA === 'number') setScoreA(data.scoreA);
      if (typeof data.scoreB === 'number') setScoreB(data.scoreB);
      if (typeof data.ropeOffset === 'number') setRopeOffset(data.ropeOffset);

      if (data.isCorrect) {
        playCorrect();
        playRopePull(data.answeringTeam);
        announceCorrect(data.answeringTeam, data.isDoublePull);
      } else {
        playWrong();
        announceWrong(data.answeringTeam);
      }
    };

    const handleReboundOpen = (data) => {
      console.log('🔥 [Rebound Open Live]:', data);
      setReboundData(data);
      setDeadline(data.deadline || Date.now() + 8000);
      setUiState('REBOUND');
      announceRebound(data.reboundTeam);
    };

    const handleTacticalCardActivated = (data) => {
      console.log('🃏 [Card Activated Live]:', data);
      if (data.tacticalCards) setTacticalCards(data.tacticalCards);
      setActiveCardEffects(prev => ({
        ...prev,
        [data.team]: data.cardType
      }));

      if (data.cardType === 'FIREWALL') playShieldUp();
      else if (data.cardType === 'DDOS') playFreezeSfx();
      else if (data.cardType === 'DOUBLE_PULL') playDoubleGavel();
      else if (data.cardType === 'FIFTY_FIFTY') playFiftyFiftyDismiss();
    };

    const handleFiftyFiftyResult = (data) => {
      if (Array.isArray(data.eliminatedIndexes)) {
        setFiftyFiftyEliminated(data.eliminatedIndexes);
      }
    };

    const handleGameOver = (data) => {
      console.log('🏆 [Game Over Live]:', data);
      setGameOverData(data);
      setUiState('FINISHED');
      setShowCutscene(true);
      playVictory();
      announceVictory(data.winner);
    };

    socket.on('spectatorJoinedSuccess', handleSpectatorSnapshot);
    socket.on('roomStateUpdate', handleRoomStateUpdate);
    socket.on('startCountdown', handleStartCountdown);
    socket.on('newQuestion', handleNewQuestion);
    socket.on('buzzerAwarded', handleBuzzerAwarded);
    socket.on('answerResult', handleAnswerResult);
    socket.on('reboundOpen', handleReboundOpen);
    socket.on('tacticalCardActivated', handleTacticalCardActivated);
    socket.on('fiftyFiftyResult', handleFiftyFiftyResult);
    socket.on('gameOver', handleGameOver);

    return () => {
      socket.emit('leaveSpectator', { roomCode: selectedRoomCode });
      socket.off('spectatorJoinedSuccess', handleSpectatorSnapshot);
      socket.off('roomStateUpdate', handleRoomStateUpdate);
      socket.off('startCountdown', handleStartCountdown);
      socket.off('newQuestion', handleNewQuestion);
      socket.off('buzzerAwarded', handleBuzzerAwarded);
      socket.off('answerResult', handleAnswerResult);
      socket.off('reboundOpen', handleReboundOpen);
      socket.off('tacticalCardActivated', handleTacticalCardActivated);
      socket.off('fiftyFiftyResult', handleFiftyFiftyResult);
      socket.off('gameOver', handleGameOver);
    };
  }, [selectedRoomCode]);

  // Countdown timer for question box
  useEffect(() => {
    if (!deadline) return;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [deadline]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Dynamic slots calculation based on room maxPerTeam (1vs1 to 5vs5)
  const maxPerTeam = roomState?.maxPerTeam || 5;
  const teamAPlayers = roomState?.teamA || [];
  const teamBPlayers = roomState?.teamB || [];
  const teamASlots = Array.from({ length: maxPerTeam }, (_, i) => teamAPlayers[i] || null);
  const teamBSlots = Array.from({ length: maxPerTeam }, (_, i) => teamBPlayers[i] || null);

  const teamACount = teamAPlayers.length || maxPerTeam;
  const teamBCount = teamBPlayers.length || maxPerTeam;
  const isIT = currentQuestion?.category === 'IT';

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1A1AFF',
        background: '#1A1AFF', // 100% Solid Flat VHU Harmony
        color: '#FFFFFF',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* ======================================================== */}
      {/* TV STAGE HEADER (SOLID #1A1AFF BAR - KHÔNG GRADIENT TỐI)  */}
      {/* ======================================================== */}
      <header
        style={{
          backgroundColor: '#1A1AFF',
          background: '#1A1AFF', // 100% Solid Flat VHU Harmony
          borderBottom: '3px solid var(--comic-black)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          zIndex: 30,
          boxShadow: '0 4px 0 var(--comic-black)'
        }}
      >
        {/* Left: Branding & Event Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={vhuLogo} alt="VHU Logo" style={{ height: 36, objectFit: 'contain' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', fontWeight: 900, color: '#FEF08A', textShadow: '0 2px 0 var(--comic-black)', letterSpacing: 0.5 }}>
              KÉO CO TRI THỨC ⚡ MÀN CHIẾU KHÁN GIẢ
            </div>
            <div style={{ fontSize: '0.74rem', color: '#FFFFFF', fontWeight: 800, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
              Trạm 1: Thử Thách Trí Tuệ • Trường Đại học Văn Hiến (VHU)
            </div>
          </div>
        </div>

        {/* Center: Match Room Badge & Dynamic Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            background: '#FACC15',
            color: '#713F12',
            border: '2px solid var(--comic-black)',
            boxShadow: '0 2px 0 var(--comic-black)',
            padding: '4px 12px',
            borderRadius: 999,
            fontWeight: 900,
            fontSize: '0.85rem'
          }}>
            🔑 PHÒNG: #{selectedRoomCode || '---'}
          </span>

          <span style={{
            background: '#FFFFFF',
            color: '#1A1AFF',
            border: '2px solid var(--comic-black)',
            boxShadow: '0 2px 0 var(--comic-black)',
            padding: '4px 10px',
            borderRadius: 999,
            fontWeight: 900,
            fontSize: '0.82rem'
          }}>
            {roomState?.mode || `${maxPerTeam}vs${maxPerTeam}`} ({maxPerTeam} người/đội)
          </span>

          {rooms.length > 1 && (
            <select
              value={selectedRoomCode}
              onChange={(e) => {
                setSelectedRoomCode(e.target.value);
                setAutoFollow(false);
              }}
              style={{
                background: '#FFFFFF',
                color: '#0F172A',
                border: '2px solid var(--comic-black)',
                borderRadius: 8,
                padding: '4px 8px',
                fontWeight: 900,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {rooms.map(r => (
                <option key={r.roomCode} value={r.roomCode}>
                  Phòng #{r.roomCode} ({r.state === 'ROUND_BUZZ' || r.state === 'ROUND_ANSWER' ? '🔴 Đang đấu' : '⏳ Sảnh'})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right: TV Controls (Audio, Fullscreen, Auto-follow) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Auto-follow switch */}
          <button
            onClick={() => setAutoFollow(!autoFollow)}
            title="Tự động bám theo phòng đang thi đấu sôi nổi nhất"
            style={{
              background: autoFollow ? '#22C55E' : '#64748B',
              color: '#FFFFFF',
              border: '2px solid var(--comic-black)',
              boxShadow: '0 2px 0 var(--comic-black)',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {autoFollow ? '⚡ Tự bắt trận: BẬT' : '⏸️ Tự bắt: TẮT'}
          </button>

          {/* Audio toggle for TV speakers */}
          <button
            onClick={() => {
              unlockAudio();
              toggleMute();
            }}
            style={{
              background: audioMuted ? '#EF4444' : '#FACC15',
              color: '#000000',
              border: '2px solid var(--comic-black)',
              boxShadow: '0 2px 0 var(--comic-black)',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: '0.78rem',
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            {audioMuted ? '🔇 BẬT ÂM LOA TV' : '🔊 LOA TV: BẬT'}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            style={{
              background: '#FFFFFF',
              color: '#0F172A',
              border: '2px solid var(--comic-black)',
              boxShadow: '0 2px 0 var(--comic-black)',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: '0.78rem',
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            {isFullscreen ? '🗗 Thu nhỏ' : '⛶ Toàn màn hình (F11)'}
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN VIEWPORT: TUG OF WAR ARENA + DYNAMIC ROSTER/QUIZ    */}
      {/* ======================================================== */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '12px 20px',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#1A1AFF',
          background: '#1A1AFF' // 100% Solid Flat VHU Harmony
        }}
      >
        {/* TIER 1: TUG OF WAR ARENA (10 CHIBI + REFEREE + SCORES) */}
        <section style={{ flex: '0 0 auto', width: '100%', marginBottom: 10 }}>
          <TugOfWarArena
            scoreA={scoreA}
            scoreB={scoreB}
            ropeOffset={ropeOffset}
            winner={gameOverData?.winner}
            teamACount={teamACount}
            teamBCount={teamBCount}
            lastResult={lastResult}
            isBuzzed={uiState === 'BUZZER_AWARDED'}
            activeCardEffects={activeCardEffects}
          />
        </section>

        {/* TIER 2: E-SPORTS LOBBY ROSTER (NO QR) OR LIVE QUESTION */}
        <section
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 0
          }}
        >
          {/* ==================================================== */}
          {/* SCENARIO 1: E-SPORTS LOBBY (DYNAMIC SLOTS 1vs1 -> 5vs5) */}
          {/* ==================================================== */}
          {uiState === 'LOBBY' && (
            <div
              style={{
                background: '#FFFFFF',
                border: '3px solid var(--comic-black)',
                borderRadius: 20,
                boxShadow: '0 8px 0 var(--comic-black)',
                padding: '16px 22px',
                color: '#0F172A',
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'space-between',
                gap: 16,
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              {/* Left Column: Team A Dynamic Slots */}
              <div
                style={{
                  flex: 1,
                  background: '#F0F9FF',
                  border: '2.5px solid var(--comic-black)',
                  borderRadius: 16,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 3px 0 var(--comic-black)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 900, color: '#0284C7' }}>
                    ⚡ ĐỘI A - TIA CHỚP
                  </span>
                  <span style={{ background: '#0284C7', color: '#FFF', padding: '3px 10px', borderRadius: 999, fontSize: '0.85rem', fontWeight: 900 }}>
                    {teamAPlayers.length}/{maxPerTeam} thành viên
                  </span>
                </div>

                {/* Dynamic Slots for Team A */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                  {teamASlots.map((p, idx) => {
                    if (p) {
                      return (
                        <div
                          key={p.socketId || idx}
                          style={{
                            background: '#FFFFFF',
                            border: '2px solid var(--comic-black)',
                            borderRadius: 10,
                            padding: '8px 12px',
                            boxShadow: '0 2px 0 var(--comic-black)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '1.1rem' }}>👤</span>
                            <div>
                              <div style={{ fontWeight: 900, fontSize: '0.96rem', color: '#0F172A' }}>
                                {p.name || `Thí sinh A${idx + 1}`}
                              </div>
                              <small style={{ color: '#64748B', fontWeight: 700, fontSize: '0.76rem' }}>
                                {p.studentId ? `${p.studentId}${p.faculty ? ' • ' + p.faculty : ''}` : 'Đại học Văn Hiến'}
                              </small>
                            </div>
                          </div>
                          <span style={{
                            background: p.isReady ? '#DCFCE7' : '#FEF3C7',
                            color: p.isReady ? '#15803D' : '#B45309',
                            border: '1.5px solid var(--comic-black)',
                            padding: '3px 8px',
                            borderRadius: 999,
                            fontSize: '0.78rem',
                            fontWeight: 900
                          }}>
                            {p.isReady ? '✅ SẴN SÀNG' : '⏳ CHỜ SẴN SÀNG'}
                          </span>
                        </div>
                      );
                    } else {
                      // Empty Slot (Waiting for player)
                      return (
                        <div
                          key={`empty-a-${idx}`}
                          style={{
                            border: '2px dashed #94A3B8',
                            borderRadius: 10,
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748B',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            background: 'rgba(255, 255, 255, 0.6)'
                          }}
                        >
                          👤 Vị trí {idx + 1}: Chờ thí sinh vào phòng...
                        </div>
                      );
                    }
                  })}
                </div>
              </div>

              {/* Center Column: e-Sports Versus Emblem (NO QR CODE) */}
              <div
                style={{
                  width: 240,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '10px'
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-title)',
                  fontSize: '2.4rem',
                  fontWeight: 900,
                  color: '#DC2626',
                  textShadow: '0 3px 0 var(--comic-black)',
                  letterSpacing: 2,
                  marginBottom: 6
                }}>
                  ⚔️ VS ⚔️
                </div>

                <div style={{
                  background: '#FEF08A',
                  border: '2px solid var(--comic-black)',
                  boxShadow: '0 3px 0 var(--comic-black)',
                  padding: '6px 14px',
                  borderRadius: 12,
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  color: '#713F12',
                  marginBottom: 8
                }}>
                  PHÒNG #{selectedRoomCode}
                </div>

                <div style={{
                  background: '#1A1AFF',
                  color: '#FFFFFF',
                  border: '2px solid var(--comic-black)',
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontWeight: 900,
                  fontSize: '0.82rem',
                  marginBottom: 10
                }}>
                  CHẾ ĐỘ {maxPerTeam} VS {maxPerTeam}
                </div>

                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#475569',
                  lineHeight: 1.4
                }}>
                  Đang tập hợp đủ {maxPerTeam * 2} thí sinh để bắt đầu kéo co!
                </div>
              </div>

              {/* Right Column: Team B Dynamic Slots */}
              <div
                style={{
                  flex: 1,
                  background: '#FFF7ED',
                  border: '2.5px solid var(--comic-black)',
                  borderRadius: 16,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 3px 0 var(--comic-black)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 900, color: '#EA580C' }}>
                    🔥 ĐỘI B - NGỌN LỬA
                  </span>
                  <span style={{ background: '#EA580C', color: '#FFF', padding: '3px 10px', borderRadius: 999, fontSize: '0.85rem', fontWeight: 900 }}>
                    {teamBPlayers.length}/{maxPerTeam} thành viên
                  </span>
                </div>

                {/* Dynamic Slots for Team B */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                  {teamBSlots.map((p, idx) => {
                    if (p) {
                      return (
                        <div
                          key={p.socketId || idx}
                          style={{
                            background: '#FFFFFF',
                            border: '2px solid var(--comic-black)',
                            borderRadius: 10,
                            padding: '8px 12px',
                            boxShadow: '0 2px 0 var(--comic-black)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '1.1rem' }}>👤</span>
                            <div>
                              <div style={{ fontWeight: 900, fontSize: '0.96rem', color: '#0F172A' }}>
                                {p.name || `Thí sinh B${idx + 1}`}
                              </div>
                              <small style={{ color: '#64748B', fontWeight: 700, fontSize: '0.76rem' }}>
                                {p.studentId ? `${p.studentId}${p.faculty ? ' • ' + p.faculty : ''}` : 'Đại học Văn Hiến'}
                              </small>
                            </div>
                          </div>
                          <span style={{
                            background: p.isReady ? '#DCFCE7' : '#FEF3C7',
                            color: p.isReady ? '#15803D' : '#B45309',
                            border: '1.5px solid var(--comic-black)',
                            padding: '3px 8px',
                            borderRadius: 999,
                            fontSize: '0.78rem',
                            fontWeight: 900
                          }}>
                            {p.isReady ? '✅ SẴN SÀNG' : '⏳ CHỜ SẴN SÀNG'}
                          </span>
                        </div>
                      );
                    } else {
                      // Empty Slot (Waiting for player)
                      return (
                        <div
                          key={`empty-b-${idx}`}
                          style={{
                            border: '2px dashed #94A3B8',
                            borderRadius: 10,
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748B',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            background: 'rgba(255, 255, 255, 0.6)'
                          }}
                        >
                          👤 Vị trí {idx + 1}: Chờ thí sinh vào phòng...
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SCENARIO 2: LIVE MATCH (QUESTION & 4 CHOICES 2X2)     */}
          {/* ==================================================== */}
          {uiState !== 'LOBBY' && currentQuestion && (
            <div
              style={{
                background: '#FFFFFF',
                border: '3px solid var(--comic-black)',
                borderRadius: 20,
                boxShadow: '0 8px 0 var(--comic-black)',
                padding: '16px 22px',
                color: '#0F172A',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              {/* Question Metadata & Timer */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        background: isIT ? '#0284C7' : '#9333EA',
                        color: '#FFF',
                        padding: '4px 12px',
                        borderRadius: 8,
                        fontWeight: 900,
                        fontSize: '0.88rem',
                        border: '2px solid var(--comic-black)',
                        boxShadow: '0 2px 0 var(--comic-black)'
                      }}
                    >
                      {isIT ? '💻 CÔNG NGHỆ THÔNG TIN' : '⚖️ PHÁP LUẬT ĐỜI SỐNG'}
                    </span>
                    <span
                      style={{
                        background: '#FEF08A',
                        color: '#713F12',
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontWeight: 900,
                        fontSize: '0.88rem',
                        border: '2px solid var(--comic-black)',
                        boxShadow: '0 2px 0 var(--comic-black)'
                      }}
                    >
                      CÂU {currentQuestion.roundNumber || 1}/{currentQuestion.totalQuestions || 15}
                    </span>
                  </div>

                  {/* Ring Timer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RingTimer
                      seconds={secondsLeft}
                      totalSeconds={uiState === 'BUZZER_AWARDED' ? 10 : uiState === 'REBOUND' ? 8 : 15}
                      size={46}
                      strokeWidth={5}
                    />
                    <span style={{ fontFamily: 'var(--font-title)', fontSize: '1.35rem', fontWeight: 900, color: secondsLeft <= 3 ? '#DC2626' : '#1A1AFF' }}>
                      {secondsLeft}s
                    </span>
                  </div>
                </div>

                {/* Big Question Text */}
                <div
                  style={{
                    fontFamily: 'var(--font-title)',
                    fontSize: '1.28rem',
                    fontWeight: 800,
                    color: '#0F172A',
                    lineHeight: 1.35,
                    marginBottom: 10
                  }}
                >
                  {currentQuestion.question}
                </div>
              </div>

              {/* Status Banner */}
              <div
                style={{
                  background:
                    uiState === 'BUZZER_AWARDED'
                      ? buzzerWinner?.team === 'A' ? '#0284C7' : '#EA580C'
                      : uiState === 'REBOUND'
                      ? reboundData?.reboundTeam === 'A' ? '#0284C7' : '#EA580C'
                      : uiState === 'ANSWER_RESULT'
                      ? lastResult?.isCorrect ? '#16A34A' : '#DC2626'
                      : '#FEF08A',
                  color: uiState === 'ROUND_BUZZ' ? '#713F12' : '#FFFFFF',
                  border: '2px solid var(--comic-black)',
                  borderRadius: 10,
                  padding: '7px 14px',
                  fontWeight: 900,
                  fontSize: '1rem',
                  textAlign: 'center',
                  marginBottom: 10,
                  boxShadow: '0 3px 0 var(--comic-black)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {uiState === 'ROUND_BUZZ' && (
                  <span>🔔 HAI ĐỘI ĐANG SUY NGHĨ & BẤM CHUÔNG GIÀNH QUYỀN TRẢ LỜI...</span>
                )}
                {uiState === 'BUZZER_AWARDED' && (
                  <span>
                    ⚡ ĐỘI {buzzerWinner?.team === 'A' ? 'A (TIA CHỚP)' : 'B (NGỌN LỬA)'} ĐÃ BẤM CHUÔNG! ({buzzerWinner?.playerName}) CÓ 10S TRẢ LỜI
                  </span>
                )}
                {uiState === 'REBOUND' && (
                  <span>
                    🔥 ĐỘI {reboundData?.reboundTeam === 'A' ? 'A (TIA CHỚP)' : 'B (NGỌN LỬA)'} CƯỚP ĐIỂM REBOUND (8S LẬT KÈO)!
                  </span>
                )}
                {uiState === 'ANSWER_RESULT' && (
                  <span>
                    {lastResult?.isCorrect
                      ? `🎉 CHÍNH XÁC! ĐỘI ${lastResult.answeringTeam === 'A' ? 'A' : 'B'} GHI ĐIỂM VÀ KÉO PHĂNG DÂY THỪNG!`
                      : `❌ TRẢ LỜI SAI! ĐỘI ${lastResult.answeringTeam === 'A' ? 'A' : 'B'} ĐÃ BỊ MẤT ĐIỂM!`}
                  </span>
                )}
              </div>

              {/* 4 Choices Grid (2x2 Layout for TV Projector) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 10,
                  flex: 1
                }}
              >
                {(currentQuestion.options || []).map((opt, idx) => {
                  const isFiftyEliminated = fiftyFiftyEliminated.includes(idx);
                  const isReboundEliminated = reboundData?.eliminatedAnswer === opt || reboundData?.eliminatedIndex === idx;
                  const isEliminated = isFiftyEliminated || isReboundEliminated;
                  const isCorrectAnswer = lastResult && (lastResult.correctAnswer === opt || Number(lastResult.correctAnswerIndex) === idx);

                  let bg = '#F8FAFC';
                  let border = '2px solid var(--comic-black)';
                  let textColor = '#0F172A';

                  if (isCorrectAnswer) {
                    bg = '#22C55E';
                    textColor = '#FFFFFF';
                  } else if (isEliminated) {
                    bg = '#FEE2E2';
                    textColor = '#94A3B8';
                  }

                  return (
                    <div
                      key={idx}
                      style={{
                        background: bg,
                        border,
                        borderRadius: 12,
                        padding: '10px 14px',
                        boxShadow: '0 3px 0 var(--comic-black)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        position: 'relative',
                        opacity: isEliminated ? 0.4 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span
                        style={{
                          background: isCorrectAnswer ? '#FFF' : '#0F172A',
                          color: isCorrectAnswer ? '#16A34A' : '#FFF',
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '0.95rem',
                          flexShrink: 0
                        }}
                      >
                        {OPTION_PREFIXES[idx]}
                      </span>

                      <span style={{ fontWeight: 800, fontSize: '1.02rem', color: textColor, flex: 1, wordBreak: 'break-word' }}>
                        {opt}
                      </span>

                      {isFiftyEliminated && (
                        <span
                          style={{
                            position: 'absolute',
                            right: 12,
                            background: '#DC2626',
                            color: '#FFF',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontWeight: 900,
                            fontSize: '0.74rem',
                            transform: 'rotate(-4deg)'
                          }}
                        >
                          ❌ BÁC BỎ 50/50
                        </span>
                      )}

                      {isCorrectAnswer && (
                        <span style={{ fontSize: '1.3rem' }}>✅</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ======================================================== */}
      {/* OVERLAY 1: GLOBAL COUNTDOWN 3-2-1                         */}
      {/* ======================================================== */}
      {countdown !== null && (
        <CountdownOverlay
          seconds={countdown}
          roomState={roomState}
        />
      )}

      {/* ======================================================== */}
      {/* OVERLAY 2: VICTORY CUTSCENE "KÉO NGÃ ĐỐI THỦ TRÊN SÂN CỎ" */}
      {/* ======================================================== */}
      {gameOverData && showCutscene && (
        <VictoryCutscene
          winner={gameOverData.winner}
          onFinish={() => setShowCutscene(false)}
        />
      )}
    </div>
  );
}
