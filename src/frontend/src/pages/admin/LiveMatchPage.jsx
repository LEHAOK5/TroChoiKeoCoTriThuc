import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../../services/socket';
import { getAdminRooms, getRoom, getActiveRooms } from '../../services/api';
import TugOfWarArena from '../../components/TugOfWarArena';
import RingTimer from '../../components/RingTimer';
import VictoryCutscene from '../../components/VictoryCutscene';
import CountdownOverlay from '../../components/CountdownOverlay';
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
  announceBothWrong,
  announceRebound,
  announceVictory
} from '../../utils/announcer';

const OPTION_PREFIXES = ['A', 'B', 'C', 'D'];

export default function LiveMatchPage({
  initialRoomCode = ''
}) {
  const [token] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token') || sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '';
  });
  const [rooms, setRooms] = useState([]);
  const [selectedRoomCode, setSelectedRoomCode] = useState(() => {
    if (initialRoomCode) return initialRoomCode;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tv') || urlParams.get('spectate') || urlParams.get('room') || '';
  });

  const [autoFollow, setAutoFollow] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return !(urlParams.get('tv') || urlParams.get('spectate') || urlParams.get('room') || initialRoomCode);
  });
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
  const [cardBanner, setCardBanner] = useState(null);

  // Subscribe to audio mute changes
  useEffect(() => {
    const unsub = subscribeMute((val) => setAudioMuted(val));
    return () => unsub();
  }, []);

  // Universal state sync helper: luôn cập nhật danh sách người chơi và tiến độ ván đấu
  const syncRoomData = (targetRoomData) => {
    if (!targetRoomData) return;
    const parsedMax = targetRoomData.maxPerTeam || parseInt((targetRoomData.mode || '1')[0], 10) || 1;
    const newTeamA = targetRoomData.teamAPlayers || targetRoomData.teamA || [];
    const newTeamB = targetRoomData.teamBPlayers || targetRoomData.teamB || [];

    setRoomState(prev => ({
      ...(prev || {}),
      roomCode: targetRoomData.roomCode || prev?.roomCode || selectedRoomCode,
      mode: targetRoomData.mode || prev?.mode || '1vs1',
      maxPerTeam: targetRoomData.maxPerTeam || parsedMax,
      state: targetRoomData.state || prev?.state || 'LOBBY',
      teamA: newTeamA.length ? newTeamA : (prev?.teamA || []),
      teamB: newTeamB.length ? newTeamB : (prev?.teamB || [])
    }));

    if (typeof targetRoomData.scoreA === 'number') setScoreA(targetRoomData.scoreA);
    if (typeof targetRoomData.scoreB === 'number') setScoreB(targetRoomData.scoreB);
    if (typeof targetRoomData.ropeOffset === 'number') setRopeOffset(targetRoomData.ropeOffset);
    if (targetRoomData.tacticalCards) setTacticalCards(targetRoomData.tacticalCards);
    if (targetRoomData.activeCardEffects) setActiveCardEffects(targetRoomData.activeCardEffects);

    // Sync match stage if room is currently playing
    if (targetRoomData.state === 'ROUND_BUZZ' || targetRoomData.state === 'ROUND_ANSWER' || targetRoomData.state === 'ROUND_REBOUND') {
      if (targetRoomData.currentQuestion) setCurrentQuestion(targetRoomData.currentQuestion);
      if (targetRoomData.deadline) setDeadline(targetRoomData.deadline);
      if (targetRoomData.buzzerWinner) setBuzzerWinner(targetRoomData.buzzerWinner);
      if (targetRoomData.reboundData) setReboundData(targetRoomData.reboundData);
      setUiState(prev => {
        if (prev === 'ANSWER_RESULT') return prev; // Đang chiếu hiệu ứng kết quả thì giữ nguyên
        if (targetRoomData.state === 'ROUND_BUZZ') return 'ROUND_BUZZ';
        if (targetRoomData.state === 'ROUND_ANSWER') return 'BUZZER_AWARDED';
        if (targetRoomData.state === 'ROUND_REBOUND') return 'REBOUND';
        return prev;
      });
    } else if (targetRoomData.state === 'COUNTDOWN') {
      setUiState('COUNTDOWN');
    } else if (targetRoomData.state === 'LOBBY') {
      setUiState('LOBBY');
      setCurrentQuestion(null);
      setGameOverData(null);
      setShowCutscene(false);
    } else if (targetRoomData.state === 'FINISHED') {
      setUiState('FINISHED');
    }
  };

  // Fetch rooms list periodically (kết hợp cả admin rooms và public room endpoint)
  const fetchRooms = async () => {
    try {
      let roomsList = [];
      if (token) {
        const res = await getAdminRooms(token);
        if (res?.success && Array.isArray(res.rooms)) {
          roomsList = res.rooms;
        }
      }
      if (roomsList.length === 0) {
        const publicRes = await getActiveRooms();
        if (publicRes?.success && Array.isArray(publicRes.rooms)) {
          roomsList = publicRes.rooms;
        }
      }

      if (roomsList.length > 0) {
        setRooms(roomsList);
        let targetCode = selectedRoomCode;
        if (!targetCode && roomsList.length > 0) {
          const playingRoom = roomsList.find(r => r.state === 'ROUND_BUZZ' || r.state === 'ROUND_ANSWER' || r.state === 'ROUND_REBOUND') || roomsList[0];
          targetCode = playingRoom.roomCode;
          setSelectedRoomCode(targetCode);
        } else if (autoFollow && !selectedRoomCode && roomsList.length > 0) {
          const activePlaying = roomsList.find(r => r.state === 'ROUND_BUZZ' || r.state === 'ROUND_ANSWER' || r.state === 'ROUND_REBOUND');
          if (activePlaying && activePlaying.roomCode !== selectedRoomCode) {
            targetCode = activePlaying.roomCode;
            setSelectedRoomCode(targetCode);
          }
        }

        const targetRoomData = roomsList.find(r => r.roomCode === (targetCode || selectedRoomCode));
        if (targetRoomData) {
          syncRoomData(targetRoomData);
        }
      }

      // Trực tiếp đồng bộ thông tin phòng qua public endpoint
      if (selectedRoomCode) {
        const directRoom = await getRoom(selectedRoomCode);
        if (directRoom && (directRoom.roomCode || directRoom.state)) {
          syncRoomData(directRoom);
        }
      }
    } catch (err) {
      console.warn('Lỗi đồng bộ phòng trực tiếp:', err);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 1000);
    return () => clearInterval(interval);
  }, [token, autoFollow, selectedRoomCode]);

  // Connect socket as spectator when selectedRoomCode changes
  useEffect(() => {
    if (!selectedRoomCode) return;

    const joinSpectatorRoom = () => {
      console.log('📺 [Spectator Joining Room]:', selectedRoomCode);
      socket.emit('joinSpectator', { roomCode: selectedRoomCode });
    };

    socket.on('connect', joinSpectatorRoom);
    if (!socket.connected) {
      socket.connect();
    } else {
      joinSpectatorRoom();
    }

    const handleSpectatorSnapshot = (data) => {
      console.log('📺 [Spectator Snapshot Received]:', data);
      syncRoomData(data);
    };

    const handleRoomStateUpdate = (data) => {
      if (data.roomCode && String(data.roomCode).toUpperCase().trim() !== String(selectedRoomCode).toUpperCase().trim()) return;
      syncRoomData(data);
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
      setActiveCardEffects({});
      setCardBanner(null);
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

      setCardBanner({
        team: data.team,
        cardType: data.cardType,
        playerName: data.playerName || (data.team === 'A' ? 'Đội A' : 'Đội B')
      });
      setTimeout(() => setCardBanner(null), 3500);

      if (data.cardType === 'FIREWALL') {
        playShieldUp();
        setActiveCardEffects(prev => ({ ...prev, firewallTeam: data.team }));
      } else if (data.cardType === 'DOUBLE_PULL') {
        playDoubleGavel();
        setActiveCardEffects(prev => ({ ...prev, doublePullTeam: data.team }));
      } else if (data.cardType === 'DDOS') {
        playFreezeSfx();
      } else if (data.cardType === 'FIFTY_FIFTY') {
        playFiftyFiftyDismiss();
      }
    };

    const handleCardEffectApplied = (data) => {
      console.log('❄️ [Card Effect Applied Live]:', data);
      if (data.type === 'FREEZE_BUZZER') {
        playFreezeSfx();
        setActiveCardEffects(prev => ({ ...prev, frozenTeam: data.targetTeam }));
        setTimeout(() => {
          setActiveCardEffects(prev => ({ ...prev, frozenTeam: null }));
        }, data.durationMs || 2500);
      }
    };

    const handleFiftyFiftyResult = (data) => {
      if (Array.isArray(data.eliminatedIndexes)) {
        setFiftyFiftyEliminated(data.eliminatedIndexes);
      }
    };

    const handleBothTeamsWrong = (data) => {
      console.log('💥 [Both Teams Wrong Live]:', data);
      setLastResult(data);
      setUiState('ANSWER_RESULT');
      if (typeof data.scoreA === 'number') setScoreA(data.scoreA);
      if (typeof data.scoreB === 'number') setScoreB(data.scoreB);
      if (typeof data.ropeOffset === 'number') setRopeOffset(data.ropeOffset);
      playWrong();
      announceBothWrong();
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
    socket.on('bothTeamsWrong', handleBothTeamsWrong);
    socket.on('tacticalCardActivated', handleTacticalCardActivated);
    socket.on('cardEffectApplied', handleCardEffectApplied);
    socket.on('fiftyFiftyResult', handleFiftyFiftyResult);
    socket.on('gameOver', handleGameOver);

    return () => {
      socket.off('connect', joinSpectatorRoom);
      socket.emit('leaveSpectator', { roomCode: selectedRoomCode });
      socket.off('spectatorJoinedSuccess', handleSpectatorSnapshot);
      socket.off('roomStateUpdate', handleRoomStateUpdate);
      socket.off('startCountdown', handleStartCountdown);
      socket.off('newQuestion', handleNewQuestion);
      socket.off('buzzerAwarded', handleBuzzerAwarded);
      socket.off('answerResult', handleAnswerResult);
      socket.off('reboundOpen', handleReboundOpen);
      socket.off('bothTeamsWrong', handleBothTeamsWrong);
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

  // Dynamic slots calculation based on room maxPerTeam (1vs1 to 5vs5)
  const currentRoomInfo = rooms.find(r => r.roomCode === selectedRoomCode);
  const effectiveMode = roomState?.mode || currentRoomInfo?.mode || '1vs1';
  const maxPerTeam = roomState?.maxPerTeam || currentRoomInfo?.maxPerTeam || (parseInt(effectiveMode[0], 10) || 1);
  const teamAPlayers = roomState?.teamA || currentRoomInfo?.teamAPlayers || [];
  const teamBPlayers = roomState?.teamB || currentRoomInfo?.teamBPlayers || [];
  const teamASlots = Array.from({ length: maxPerTeam }, (_, i) => teamAPlayers[i] || null);
  const teamBSlots = Array.from({ length: maxPerTeam }, (_, i) => teamBPlayers[i] || null);

  const teamACount = maxPerTeam;
  const teamBCount = maxPerTeam;
  const isIT = currentQuestion?.category === 'IT';

  const otherRooms = rooms.filter(r => r.roomCode !== selectedRoomCode);
  const nextPlayingRoom = otherRooms.find(r => r.state === 'ROUND_BUZZ' || r.state === 'ROUND_ANSWER' || r.state === 'ROUND_REBOUND') || otherRooms.find(r => r.state === 'LOBBY');
  const isWinnerA = gameOverData?.winner === 'A' || scoreA >= 10 || (gameOverData && scoreA > scoreB);
  const isWinnerB = gameOverData?.winner === 'B' || scoreB >= 10 || (gameOverData && scoreB > scoreA);

  const handleSwitchRoom = (newCode) => {
    if (!newCode || newCode === selectedRoomCode) return;
    const cleanCode = newCode.toUpperCase().trim();
    setSelectedRoomCode(cleanCode);
    setGameOverData(null);
    setCurrentQuestion(null);
    setUiState('LOBBY');
    setLastResult(null);
    setBuzzerWinner(null);
    setReboundData(null);
    setShowCutscene(false);
    setActiveCardEffects({});
    setCardBanner(null);

    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set('tv', cleanCode);
      window.history.replaceState({}, '', url.toString());
    }

    getRoom(cleanCode).then(r => {
      if (r && (r.roomCode || r.state)) syncRoomData(r);
    }).catch(err => console.warn(err));
  };

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
          <div>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 900, color: '#FEF08A', textShadow: '0 2px 0 var(--comic-black)', letterSpacing: 0.5 }}>
              ⚔️ KÉO CO TRI THỨC
            </div>
            <div style={{ fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 800, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
              Trạm 1: Thử Thách Trí Tuệ
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
            {effectiveMode} ({maxPerTeam} người/đội)
          </span>

          {rooms.length > 1 && (
            <select
              value={selectedRoomCode}
              onChange={(e) => {
                handleSwitchRoom(e.target.value);
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
                  Phòng #{r.roomCode} ({r.state === 'ROUND_BUZZ' || r.state === 'ROUND_ANSWER' ? '🔴 Đang đấu' : r.state === 'FINISHED' ? '🏆 Đã xong' : '⏳ Sảnh'})
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
        <section style={{ flex: '0 0 auto', width: '100%', marginBottom: 10, position: 'relative' }}>
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
            tacticalCards={tacticalCards}
          />

          {/* POP-UP BANNER THÔNG BÁO DÙNG THẺ BÀI CHIẾN THUẬT NỔI BẬT */}
          {cardBanner && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 60,
                background: cardBanner.team === 'A' ? 'linear-gradient(135deg, #0284C7, #0369A1)' : 'linear-gradient(135deg, #EA580C, #C2410C)',
                border: '4px solid var(--comic-black)',
                boxShadow: '0 8px 0 var(--comic-black)',
                borderRadius: 20,
                padding: '14px 28px',
                color: '#FFFFFF',
                textAlign: 'center',
                minWidth: 380,
                maxWidth: '92%',
                animation: 'bounceIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, color: '#FEF08A' }}>
                ⚡ KÍCH HOẠT THẺ BÀI CHIẾN THUẬT!
              </div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.45rem', fontWeight: 900, margin: '4px 0', textShadow: '0 2px 0 var(--comic-black)' }}>
                {cardBanner.cardType === 'FIREWALL' && '🛡️ TƯỜNG LỬA (CHỐNG CƯỚP REBOUND)'}
                {cardBanner.cardType === 'DDOS' && '❄️ ĐÓNG BĂNG DDOS ĐỐI THỦ (2.5S)'}
                {cardBanner.cardType === 'DOUBLE_PULL' && '⚖️ KÉO X2 (GẤP ĐÔI SỨC KÉO)'}
                {cardBanner.cardType === 'FIFTY_FIFTY' && '🎯 TRỢ GIÚP 50/50 (BÁC BỎ 2 ĐÁP ÁN)'}
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, background: 'rgba(0,0,0,0.3)', padding: '3px 12px', borderRadius: 999, display: 'inline-block' }}>
                Đội {cardBanner.team === 'A' ? 'A (TIA CHỚP)' : 'B (NGỌN LỬA)'} • {cardBanner.playerName} tung đòn!
              </div>
            </div>
          )}
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
          {uiState !== 'LOBBY' && uiState !== 'FINISHED' && currentQuestion && (
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
                  const isCorrectAnswer = lastResult && (
                    lastResult.correctOption === opt ||
                    lastResult.correctAnswer === opt ||
                    Number(lastResult.correctIndex) === idx ||
                    Number(lastResult.correctAnswerIndex) === idx
                  );

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

          {/* ==================================================== */}
          {/* SCENARIO 3: MATCH FINISHED (PODIUM & ROOM SWITCHER) */}
          {/* ==================================================== */}
          {uiState === 'FINISHED' && (
            <div
              style={{
                background: '#FFFFFF',
                border: '3px solid var(--comic-black)',
                borderRadius: 20,
                boxShadow: '0 8px 0 var(--comic-black)',
                padding: '18px 22px',
                color: '#0F172A',
                display: 'flex',
                gap: 20,
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              {/* Left Column: Victory Podium & Match Summary */}
              <div
                style={{
                  flex: 1.1,
                  background: isWinnerA ? '#F0F9FF' : '#FFF7ED',
                  border: '2.5px solid var(--comic-black)',
                  borderRadius: 16,
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  boxShadow: '0 4px 0 var(--comic-black)'
                }}
              >
                <div style={{ fontSize: '3.6rem', marginBottom: 4 }}>🏆</div>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.65rem', fontWeight: 900, color: isWinnerA ? '#0284C7' : '#EA580C', textShadow: '0 2px 0 var(--comic-black)', lineHeight: 1.2 }}>
                  {isWinnerA ? '🎉 ĐỘI A (VHU TIA CHỚP) VÔ ĐỊCH!' : isWinnerB ? '🎉 ĐỘI B (VHU NGỌN LỬA) VÔ ĐỊCH!' : '🤝 TRẬN ĐẤU KẾT THÚC HÒA!'}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: '10px 0 6px 0' }}>
                  TỈ SỐ CHUNG CUỘC: <span style={{ color: '#0284C7' }}>{scoreA}</span> - <span style={{ color: '#EA580C' }}>{scoreB}</span>
                </div>
                <div style={{ fontSize: '0.86rem', color: '#64748B', fontWeight: 700, marginBottom: 12 }}>
                  Phòng thi đấu #{selectedRoomCode} đã hoàn tất phần thi!
                </div>
                {/* Winning Team Players */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {(isWinnerA ? teamAPlayers : teamBPlayers).map((p, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#FEF08A',
                        color: '#713F12',
                        border: '1.5px solid var(--comic-black)',
                        boxShadow: '0 2px 0 var(--comic-black)',
                        padding: '4px 12px',
                        borderRadius: 999,
                        fontWeight: 900,
                        fontSize: '0.85rem'
                      }}
                    >
                      🎖️ {p.name} ({p.studentId})
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Column: Other Active Rooms Navigator */}
              <div
                style={{
                  flex: 1.3,
                  background: '#FAF5FF',
                  border: '2.5px solid var(--comic-black)',
                  borderRadius: 16,
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 0 var(--comic-black)',
                  minHeight: 0
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.12rem', fontWeight: 900, color: '#7E22CE' }}>
                    🔴 CÁC PHÒNG ĐẤU KHÁC ĐANG DIỄN RA ({otherRooms.length})
                  </div>
                  {nextPlayingRoom && (
                    <button
                      onClick={() => handleSwitchRoom(nextPlayingRoom.roomCode)}
                      style={{
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: '#FFFFFF',
                        border: '2px solid var(--comic-black)',
                        boxShadow: '0 3px 0 var(--comic-black)',
                        padding: '6px 14px',
                        borderRadius: 10,
                        fontWeight: 900,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      ⏭️ XEM PHÒNG #{nextPlayingRoom.roomCode}
                    </button>
                  )}
                </div>

                {/* List of Other Rooms */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
                  {otherRooms.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748B', fontWeight: 700, padding: 32, background: '#FFFFFF', borderRadius: 12, border: '1.5px dashed #CBD5E1' }}>
                      Hiện chưa có phòng thi đấu nào khác đang mở.
                      <div style={{ marginTop: 6, fontSize: '0.82rem', color: '#94A3B8' }}>
                        Admin có thể tạo thêm phòng từ Bảng điều khiển quản trị!
                      </div>
                    </div>
                  ) : (
                    otherRooms.map(r => {
                      const isPlaying = r.state === 'ROUND_BUZZ' || r.state === 'ROUND_ANSWER' || r.state === 'ROUND_REBOUND';
                      const isLobby = r.state === 'LOBBY';
                      return (
                        <div
                          key={r.roomCode}
                          style={{
                            background: '#FFFFFF',
                            border: '2px solid var(--comic-black)',
                            borderRadius: 12,
                            padding: '10px 14px',
                            boxShadow: '0 2px 0 var(--comic-black)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 10
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 900, color: '#1A1AFF' }}>
                              #{r.roomCode}
                            </span>
                            <span style={{ background: '#E0E7FF', color: '#3730A3', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800 }}>
                              {r.mode || '1vs1'}
                            </span>
                            <span style={{
                              background: isPlaying ? '#DCFCE7' : isLobby ? '#FEF08A' : '#F1F5F9',
                              color: isPlaying ? '#166534' : isLobby ? '#854D0E' : '#475569',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: '0.75rem',
                              fontWeight: 800
                            }}>
                              {isPlaying
                                ? `⚡ ĐANG ĐẤU (Câu ${r.roundCount || 1} | ${r.scoreA || 0}-${r.scoreB || 0})`
                                : isLobby
                                ? `⏳ SẢNH CHỜ (${r.teamACount + r.teamBCount}/${(r.maxPerTeam || 1) * 2})`
                                : '🏆 ĐÃ KẾT THÚC'}
                            </span>
                          </div>

                          <button
                            onClick={() => handleSwitchRoom(r.roomCode)}
                            style={{
                              background: '#1A1AFF',
                              color: '#FFFFFF',
                              border: '1.5px solid var(--comic-black)',
                              boxShadow: '0 2px 0 var(--comic-black)',
                              padding: '6px 12px',
                              borderRadius: 8,
                              fontWeight: 900,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            👁️ CHIẾU PHÒNG NÀY
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
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
