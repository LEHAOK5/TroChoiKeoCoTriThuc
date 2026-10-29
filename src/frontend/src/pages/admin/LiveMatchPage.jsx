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
const OPTION_SHAPES = ['⚪', '🔺', '⏹️', '🔶'];

export default function LiveMatchPage({
  onBack,
  isIndependentTab = false,
  initialRoomCode = ''
}) {
  const [token] = useState(() => sessionStorage.getItem('adminToken') || '');
  const [rooms, setRooms] = useState([]);
  const [selectedRoomCode, setSelectedRoomCode] = useState(() => {
    if (initialRoomCode) return initialRoomCode;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('spectate') || urlParams.get('room') || urlParams.get('tv') || '';
  });

  const [autoFollow, setAutoFollow] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
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
  const [isFrozenTeam, setIsFrozenTeam] = useState(null);
  const [frozenSecondsLeft, setFrozenSecondsLeft] = useState(0);

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

  // Connect socket as spectator when roomCode changes
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

      if (data.currentQuestion) {
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

      if (data.state === 'LOBBY') {
        setUiState('LOBBY');
        setCurrentQuestion(null);
        setBuzzerWinner(null);
        setReboundData(null);
        setLastResult(null);
        setFiftyFiftyEliminated([]);
        setIsFrozenTeam(null);
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
      setIsFrozenTeam(null);
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

    const handleCardEffectApplied = (data) => {
      if (data.effect === 'FROZEN') {
        setIsFrozenTeam(data.targetTeam);
        setFrozenSecondsLeft(Math.ceil((data.durationMs || 2500) / 1000));
      }
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
    socket.on('cardEffectApplied', handleCardEffectApplied);
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
      socket.off('cardEffectApplied', handleCardEffectApplied);
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

  // Open independent tab for TV
  const handleOpenIndependentTab = (code) => {
    const room = code || selectedRoomCode;
    const url = `${window.location.origin}/?spectate=${room}`;
    window.open(url, '_blank');
  };

  const roomJoinUrl = selectedRoomCode
    ? `${window.location.origin}/?room=${selectedRoomCode}`
    : window.location.origin;

  const teamACount = roomState?.teamA?.length || 5;
  const teamBCount = roomState?.teamB?.length || 5;
  const isIT = currentQuestion?.category === 'IT';

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#1A1AFF',
        color: '#FFFFFF',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* ======================================================== */}
      {/* TV STAGE HEADER (BAR QUẢN LÝ PHÒNG & ĐIỀU KHIỂN TRÌNH CHIẾU) */}
      {/* ======================================================== */}
      <header
        style={{
          background: 'linear-gradient(180deg, #101077 0%, #1A1AFF 100%)',
          borderBottom: '3px solid var(--comic-black)',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          zIndex: 30,
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
        }}
      >
        {/* Left: Branding & Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: '#FFFFFF',
                color: '#0F172A',
                border: '2px solid var(--comic-black)',
                boxShadow: '0 3px 0 var(--comic-black)',
                borderRadius: 10,
                padding: '6px 12px',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              ⬅️ Quay lại Quản trị
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={vhuLogo} alt="VHU Logo" style={{ height: 32, objectFit: 'contain' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', fontWeight: 900, color: '#FEF08A', textShadow: '0 1px 2px #000' }}>
                KÉO CO TRI THỨC ⚡ MÀN CHIẾU TV TRỰC TIẾP
              </div>
              <small style={{ fontSize: '0.72rem', color: '#E2E8F0', fontWeight: 700 }}>
                Trạm 1: Thử Thách Trí Tuệ • Đại học Văn Hiến
              </small>
            </div>
          </div>
        </div>

        {/* Center: Active Rooms Selector Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', maxWidth: '45%' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FEF08A', flexShrink: 0 }}>
            CHỌN PHÒNG ĐẤU:
          </span>
          {rooms.length === 0 ? (
            <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Chưa có phòng nào mở</span>
          ) : (
            rooms.map(r => {
              const isSelected = r.roomCode === selectedRoomCode;
              const isPlaying = r.state === 'ROUND_BUZZ' || r.state === 'ROUND_ANSWER' || r.state === 'ROUND_REBOUND';
              return (
                <button
                  key={r.roomCode}
                  onClick={() => {
                    setSelectedRoomCode(r.roomCode);
                    setAutoFollow(false);
                  }}
                  style={{
                    background: isSelected ? '#FACC15' : isPlaying ? '#EF4444' : '#FFFFFF',
                    color: isSelected ? '#000' : isPlaying ? '#FFF' : '#0F172A',
                    border: '2px solid var(--comic-black)',
                    boxShadow: isSelected ? '0 3px 0 var(--comic-black)' : '0 2px 0 var(--comic-black)',
                    borderRadius: 999,
                    padding: '3px 10px',
                    fontSize: '0.76rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    flexShrink: 0,
                    transform: isSelected ? 'scale(1.05)' : 'none'
                  }}
                >
                  <span>{isPlaying ? '🔴' : '⏳'}</span>
                  <span>#{r.roomCode}</span>
                  {isPlaying && (
                    <span style={{ fontSize: '0.7rem', background: '#000', color: '#FFF', padding: '0 4px', borderRadius: 4 }}>
                      {r.scoreA || 0}-{r.scoreB || 0}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Right: TV Controls (Audio, Fullscreen, QR, Auto-follow) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Auto-follow switch */}
          <button
            onClick={() => setAutoFollow(!autoFollow)}
            title="Tự động chuyển sang phòng đang thi đấu sôi nổi nhất"
            style={{
              background: autoFollow ? '#22C55E' : '#64748B',
              color: '#FFFFFF',
              border: '2px solid var(--comic-black)',
              boxShadow: '0 2px 0 var(--comic-black)',
              borderRadius: 8,
              padding: '5px 9px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {autoFollow ? '⚡ Tự bắt trận: BẬT' : '⏸️ Tự bắt trận: TẮT'}
          </button>

          {/* Audio toggle */}
          <button
            onClick={() => {
              unlockAudio();
              toggleMute();
            }}
            style={{
              background: audioMuted ? '#EF4444' : '#FACC15',
              color: '#000',
              border: '2px solid var(--comic-black)',
              boxShadow: '0 2px 0 var(--comic-black)',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: '0.78rem',
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            {audioMuted ? '🔇 BẬT ÂM TV' : '🔊 LOA TV: BẬT'}
          </button>

          {/* QR Popup toggle */}
          <button
            onClick={() => setShowQrModal(!showQrModal)}
            style={{
              background: '#38BDF8',
              color: '#000',
              border: '2px solid var(--comic-black)',
              boxShadow: '0 2px 0 var(--comic-black)',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: '0.78rem',
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            📱 MÃ QR PHÒNG
          </button>

          {/* Open Independent Tab */}
          {!isIndependentTab && (
            <button
              onClick={() => handleOpenIndependentTab()}
              title="Mở tab riêng để kéo sang màn hình TV"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
                color: '#FFF',
                border: '2px solid var(--comic-black)',
                boxShadow: '0 2px 0 var(--comic-black)',
                borderRadius: 8,
                padding: '5px 10px',
                fontSize: '0.78rem',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              ↗ TAB TV RIÊNG
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            style={{
              background: '#FFFFFF',
              color: '#0F172A',
              border: '2px solid var(--comic-black)',
              boxShadow: '0 2px 0 var(--comic-black)',
              borderRadius: 8,
              padding: '5px 9px',
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
      {/* MAIN VIEWPORT: TUG OF WAR ARENA + QUESTION & CHOICES     */}
      {/* ======================================================== */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '10px 18px',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* TOP HALF: TUG OF WAR ARENA (10 CHIBI + REFEREE + SCORES) */}
        <section style={{ flex: '0 0 auto', width: '100%', marginBottom: 8 }}>
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

        {/* BOTTOM HALF: LIVE STADIUM ACTION & QUESTIONS OR LOBBY SCREEN */}
        <section
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 0
          }}
        >
          {/* SCENARIO 1: LOBBY VIEW (WAITING FOR PLAYERS) */}
          {uiState === 'LOBBY' && (
            <div
              style={{
                background: '#FFFFFF',
                border: '3px solid var(--comic-black)',
                borderRadius: 20,
                boxShadow: '0 6px 0 var(--comic-black)',
                padding: '20px 24px',
                color: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              {/* Team A Roster */}
              <div
                style={{
                  flex: 1,
                  background: '#F0F9FF',
                  border: '2.5px solid var(--comic-black)',
                  borderRadius: 14,
                  padding: 14,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', fontWeight: 900, color: '#0284C7' }}>
                    ⚡ ĐỘI A - TIA CHỚP
                  </span>
                  <span style={{ background: '#0284C7', color: '#FFF', padding: '2px 8px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 900 }}>
                    {roomState?.teamA?.length || 0}/{roomState?.maxPerTeam || 5}
                  </span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(!roomState?.teamA || roomState.teamA.length === 0) ? (
                    <div style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', margin: 'auto' }}>
                      Đang đợi thí sinh quét mã vào Đội A...
                    </div>
                  ) : (
                    roomState.teamA.map((p, i) => (
                      <div
                        key={p.socketId || i}
                        style={{
                          background: '#FFF',
                          border: '2px solid var(--comic-black)',
                          borderRadius: 8,
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>👤 {p.name || `Thí sinh ${i + 1}`}</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 900, color: p.isReady ? '#16A34A' : '#D97706' }}>
                          {p.isReady ? '✅ SẴN SÀNG' : '⏳ CHỜ'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Center: Giant QR Scanner & Match Ready Banner */}
              <div
                style={{
                  width: 280,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '10px'
                }}
              >
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 900, color: '#1A1AFF', marginBottom: 6 }}>
                  QUÉT ĐỂ THI ĐẤU
                </div>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(roomJoinUrl)}`}
                  alt="QR Join Room"
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: 14,
                    border: '3px solid var(--comic-black)',
                    padding: 6,
                    background: '#FFF',
                    boxShadow: '0 4px 0 var(--comic-black)',
                    marginBottom: 8
                  }}
                />
                <div style={{ background: '#FEF08A', border: '2px solid var(--comic-black)', padding: '4px 12px', borderRadius: 999, fontWeight: 900, fontSize: '0.9rem', color: '#713F12' }}>
                  🔑 MÃ PHÒNG: #{selectedRoomCode}
                </div>
                <small style={{ color: '#64748B', fontWeight: 700, marginTop: 4 }}>
                  Chế độ {roomState?.mode || '5vs5'} • Tối đa {roomState?.maxPerTeam || 5} người/đội
                </small>
              </div>

              {/* Team B Roster */}
              <div
                style={{
                  flex: 1,
                  background: '#FFF7ED',
                  border: '2.5px solid var(--comic-black)',
                  borderRadius: 14,
                  padding: 14,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', fontWeight: 900, color: '#EA580C' }}>
                    🔥 ĐỘI B - NGỌN LỬA
                  </span>
                  <span style={{ background: '#EA580C', color: '#FFF', padding: '2px 8px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 900 }}>
                    {roomState?.teamB?.length || 0}/{roomState?.maxPerTeam || 5}
                  </span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(!roomState?.teamB || roomState.teamB.length === 0) ? (
                    <div style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', margin: 'auto' }}>
                      Đang đợi thí sinh quét mã vào Đội B...
                    </div>
                  ) : (
                    roomState.teamB.map((p, i) => (
                      <div
                        key={p.socketId || i}
                        style={{
                          background: '#FFF',
                          border: '2px solid var(--comic-black)',
                          borderRadius: 8,
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>👤 {p.name || `Thí sinh ${i + 1}`}</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 900, color: p.isReady ? '#16A34A' : '#D97706' }}>
                          {p.isReady ? '✅ SẴN SÀNG' : '⏳ CHỜ'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SCENARIO 2: ACTIVE MATCH (QUESTION + 4 CHOICES ON TV) */}
          {uiState !== 'LOBBY' && currentQuestion && (
            <div
              style={{
                background: '#FFFFFF',
                border: '3px solid var(--comic-black)',
                borderRadius: 20,
                boxShadow: '0 6px 0 var(--comic-black)',
                padding: '14px 20px',
                color: '#0F172A',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              {/* Question Header & Live Status */}
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
                        fontSize: '0.85rem',
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
                        fontSize: '0.85rem',
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
                      size={44}
                      strokeWidth={5}
                    />
                    <span style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 900, color: secondsLeft <= 3 ? '#DC2626' : '#1A1AFF' }}>
                      {secondsLeft}s
                    </span>
                  </div>
                </div>

                {/* Question Text */}
                <div
                  style={{
                    fontFamily: 'var(--font-title)',
                    fontSize: '1.22rem',
                    fontWeight: 800,
                    color: '#0F172A',
                    lineHeight: 1.35,
                    marginBottom: 10
                  }}
                >
                  {currentQuestion.question}
                </div>
              </div>

              {/* Status Banner (Ai giành quyền chuông / Rebound) */}
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
                  padding: '6px 14px',
                  fontWeight: 900,
                  fontSize: '0.96rem',
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

              {/* 4 Choices Grid (2x2 Layout for TV) */}
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
                        opacity: isEliminated ? 0.45 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span
                        style={{
                          background: isCorrectAnswer ? '#FFF' : '#0F172A',
                          color: isCorrectAnswer ? '#16A34A' : '#FFF',
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '0.9rem',
                          flexShrink: 0
                        }}
                      >
                        {OPTION_PREFIXES[idx]}
                      </span>

                      <span style={{ fontWeight: 800, fontSize: '0.98rem', color: textColor, flex: 1, wordBreak: 'break-word' }}>
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
                            fontSize: '0.72rem',
                            transform: 'rotate(-4deg)'
                          }}
                        >
                          ❌ BÁC BỎ 50/50
                        </span>
                      )}

                      {isCorrectAnswer && (
                        <span style={{ fontSize: '1.2rem' }}>✅</span>
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

      {/* ======================================================== */}
      {/* OVERLAY 3: QR CODE MODAL FOR BOOTH AUDIENCE               */}
      {/* ======================================================== */}
      {showQrModal && (
        <div
          onClick={() => setShowQrModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              border: '4px solid var(--comic-black)',
              borderRadius: 24,
              padding: 30,
              textAlign: 'center',
              boxShadow: '0 10px 0 var(--comic-black)',
              maxWidth: 420
            }}
          >
            <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.6rem', fontWeight: 900, color: '#1A1AFF', marginBottom: 6 }}>
              QUÉT MÃ THAM GIA ĐẤU
            </div>
            <div style={{ color: '#64748B', fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>
              Mở camera hoặc Zalo trên điện thoại quét để vào phòng ngay
            </div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(roomJoinUrl)}`}
              alt="QR Code"
              style={{
                width: 220,
                height: 220,
                borderRadius: 16,
                border: '3px solid var(--comic-black)',
                padding: 10,
                background: '#FFF',
                marginBottom: 16
              }}
            />
            <div style={{ background: '#FEF08A', border: '2px solid var(--comic-black)', padding: '6px 16px', borderRadius: 999, fontWeight: 900, fontSize: '1.2rem', color: '#713F12', marginBottom: 16 }}>
              MÃ PHÒNG: #{selectedRoomCode}
            </div>
            <button
              onClick={() => setShowQrModal(false)}
              style={{
                background: '#1A1AFF',
                color: '#FFF',
                border: '2px solid var(--comic-black)',
                boxShadow: '0 3px 0 var(--comic-black)',
                borderRadius: 10,
                padding: '8px 24px',
                fontWeight: 900,
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              ĐÓNG CỬA SỔ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
