import React, { useState, useEffect, useRef } from 'react';
import { socket } from './services/socket';
import { registerPlayer, quickMatch } from './services/api';
import ConnectionBadge from './components/ConnectionBadge';
import RegisterPage from './pages/RegisterPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import AdminPage from './pages/admin/AdminPage';
import CountdownOverlay from './components/CountdownOverlay';
import {
  playBuzzer,
  playCorrect,
  playWrong,
  playRopePull,
  playCountdown,
  playVictory,
  playCrowdMurmur,
  playCrowdCheer,
  playCrowdGasp,
  setBGMMode,
  stopBGM,
  playRegistrationTheme,
  stopRegistrationTheme,
  isMuted,
  toggleMute,
  subscribeMute,
  unlockAudio
} from './utils/audio';
import {
  announceBuzzer,
  announceCorrect,
  announceWrong,
  announceRebound,
  announceBothWrong,
  announceVictory,
  isVoiceMuted,
  toggleVoiceMute,
  subscribeVoiceMute
} from './utils/announcer';
import { BOOTH_LABEL } from './config/env';
export default function App() {
  const isCutscenePreview = typeof window !== 'undefined' && window.location.hash.startsWith('#cutscene');
  const isGamePreview = typeof window !== 'undefined' && (window.location.hash === '#game' || window.location.hash === '#preview' || isCutscenePreview);
  const [currentPage, setCurrentPage] = useState(() => {
    if (window.location.hash === '#admin' || window.location.search.includes('admin')) return 'ADMIN';
    if (isGamePreview) return 'GAME';
    return 'REGISTER';
  });
  const [isConnected, setIsConnected] = useState(false);
  const [pingMs, setPingMs] = useState(25);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [audioMuted, setAudioMuted] = useState(() => isMuted());
  const [voiceMuted, setVoiceMutedState] = useState(() => isVoiceMuted());

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen to mute state changes and unlock audio on first interaction
  useEffect(() => {
    const unsubAudio = subscribeMute((val) => setAudioMuted(val));
    const unsubVoice = subscribeVoiceMute((val) => setVoiceMutedState(val));
    const handleFirstGesture = () => {
      unlockAudio();
      if (currentPageRef.current === 'REGISTER') {
        playRegistrationTheme();
      }
    };
    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });
    return () => {
      unsubAudio();
      unsubVoice();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, []);

  // Player & Session (Isolated per browser tab using sessionStorage)
  const [player, setPlayer] = useState(() => {
    try {
      const saved = sessionStorage.getItem('keoco_player');
      return saved ? JSON.parse(saved) : (isGamePreview ? { name: 'Thí sinh A', team: 'A' } : null);
    } catch {
      return null;
    }
  });
  const [sessionToken, setSessionToken] = useState(() => sessionStorage.getItem('keoco_token') || '');

  // Room & Battle States (5 vs 5 mặc định cho sinh viên VHU)
  const [roomState, setRoomState] = useState(() => isGamePreview ? {
    teamA: [{}, {}, {}, {}, {}],
    teamB: [{}, {}, {}, {}, {}],
    mode: '5vs5',
    maxPerTeam: 5
  } : null);
  const [scoreA, setScoreA] = useState(1);
  const [scoreB, setScoreB] = useState(0);
  const [ropeOffset, setRopeOffset] = useState(-2);
  const [countdown, setCountdown] = useState(null);

  // In-Game UI state: 'QUESTION_WAITING', 'BUZZER_SELF', 'BUZZER_OPPONENT', 'STEAL_PHASE', 'LOCKED'
  const [uiState, setUiState] = useState('QUESTION_WAITING');
  const [currentQuestion, setCurrentQuestion] = useState(() => {
    if (isGamePreview) {
      return {
        question: 'Việc xóa, thay đổi dữ liệu trên hệ thống máy tính của người khác mà không có sự cho phép có thể bị xử lý theo quy định nào?',
        category: 'LAW',
        options: [
          'Bộ luật Hình sự – Tội xâm phạm trái phép vào mạng máy tính',
          'Chỉ yêu cầu khôi phục lại dữ liệu ban đầu',
          'Chỉ xử lý theo Luật Dân sự thông thường',
          'Không có quy định pháp luật điều chỉnh'
        ]
      };
    }
    return null;
  });
  const [deadline, setDeadline] = useState(null);
  const [buzzerData, setBuzzerData] = useState(null);
  const [reboundData, setReboundData] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [gameOverData, setGameOverData] = useState(() => {
    if (isCutscenePreview) {
      return {
        winner: window.location.hash === '#cutscene-b' ? 'B' : 'A',
        scoreA: window.location.hash === '#cutscene-b' ? 4 : 10,
        scoreB: window.location.hash === '#cutscene-b' ? 10 : 4,
        matchCode: 'MATCH-VHU-FINAL'
      };
    }
    return null;
  });

  // Synchronized state refs to prevent stale closures in socket events
  const playerRef = useRef(player);
  const sessionTokenRef = useRef(sessionToken);
  const roomStateRef = useRef(roomState);
  const uiStateRef = useRef(uiState);
  const currentPageRef = useRef(currentPage);

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { sessionTokenRef.current = sessionToken; }, [sessionToken]);
  useEffect(() => { roomStateRef.current = roomState; }, [roomState]);
  useEffect(() => { uiStateRef.current = uiState; }, [uiState]);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  useEffect(() => {
    if (currentPage === 'REGISTER') {
      stopBGM();
      playRegistrationTheme();
    } else if (currentPage === 'LOBBY') {
      stopRegistrationTheme(true);
      setBGMMode('LOBBY');
    } else if (currentPage === 'GAME') {
      stopRegistrationTheme(true);
    } else if (currentPage === 'ADMIN') {
      stopRegistrationTheme(false);
      stopBGM();
    }
  }, [currentPage]);

  useEffect(() => {
    // Persistent single Socket.io connection
    socket.connect();

    socket.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);

      // Re-synchronize session and room membership
      const token = sessionTokenRef.current;
      const rCode = sessionStorage.getItem('keoco_roomCode') || roomStateRef.current?.roomCode || 'KCO1';
      if (token) {
        socket.emit('resumeSession', { sessionToken: token, roomCode: rCode });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsReconnecting(true);
    });

    socket.on('joinedSuccess', ({ player: p, roomCode: rCode }) => {
      setPlayer(p);
      sessionStorage.setItem('keoco_player', JSON.stringify(p));
      if (rCode) sessionStorage.setItem('keoco_roomCode', rCode);
      if (currentPageRef.current === 'REGISTER') {
        setCurrentPage('LOBBY');
      }
    });

    socket.on('roomStateUpdate', (state) => {
      setRoomState(state);
      setScoreA(state.scoreA);
      setScoreB(state.scoreB);
      setRopeOffset(state.ropeOffset);

      if (state.state === 'LOBBY') {
        if (currentPageRef.current === 'GAME') setCurrentPage('LOBBY');
        setGameOverData(null);
        setCurrentQuestion(null);
      }
    });

    socket.on('startCountdown', ({ seconds }) => {
      setCountdown(seconds);
      playCountdown(seconds);
      if (seconds > 0) {
        setBGMMode('COUNTDOWN');
      } else {
        setCountdown(null);
      }
    });

    socket.on('newQuestion', ({ question, state, scoreA: sA, scoreB: sB, ropeOffset: rO, deadline: dl }) => {
      setCountdown(null);
      setCurrentPage('GAME');
      setUiState('QUESTION_WAITING');
      setCurrentQuestion(question);
      setDeadline(dl);
      setBuzzerData(null);
      setReboundData(null);
      setLastResult(null);
      setScoreA(sA);
      setScoreB(sB);
      setRopeOffset(rO);

      // Dynamic BGM: Nếu sắp chạm vạch thắng (offset >= 2 hoặc tỷ số >= 3), kích hoạt TENSION BGM 152BPM!
      const isMatchPoint = Math.abs(rO || 0) >= 2 || (sA !== undefined && sB !== undefined && (sA >= 3 || sB >= 3));
      if (isMatchPoint) {
        setBGMMode('TENSION');
      } else {
        setBGMMode('BATTLE');
      }
    });

    socket.on('buzzerAwarded', (data) => {
      playBuzzer();
      playCrowdMurmur();
      announceBuzzer(data.team);
      setBuzzerData(data);
      setDeadline(data.deadline);

      const curPlayer = playerRef.current;
      const isMyTeam = curPlayer && curPlayer.team === data.team;
      setUiState(isMyTeam ? 'BUZZER_SELF' : 'BUZZER_OPPONENT');
    });

    socket.on('answerResult', (result) => {
      setLastResult(result);
      setScoreA(result.scoreA);
      setScoreB(result.scoreB);
      setRopeOffset(result.ropeOffset);
      setUiState('LOCKED');

      if (result.isCorrect) {
        playCorrect();
        playRopePull();
        playCrowdCheer();
        announceCorrect(result.answeringTeam);
        if (Math.abs(result.ropeOffset || 0) >= 2) {
          setBGMMode('TENSION');
        }
      } else {
        playWrong();
        playCrowdGasp();
        announceWrong(result.answeringTeam);
      }
    });

    socket.on('reboundOpen', (data) => {
      playWrong();
      playCrowdGasp();
      announceRebound(data.reboundTeam);
      setReboundData(data);
      setDeadline(data.deadline);

      const curPlayer = playerRef.current;
      const isMyRebound = curPlayer && curPlayer.team === data.reboundTeam;
      setUiState(isMyRebound ? 'STEAL_PHASE' : 'BUZZER_OPPONENT');
    });

    socket.on('bothTeamsWrong', (data) => {
      playWrong();
      playCrowdGasp();
      announceBothWrong();
      setLastResult(data);
      setUiState('LOCKED');
    });

    socket.on('gameOver', (data) => {
      stopBGM();
      playVictory();
      announceVictory(data.winner);
      setGameOverData(data);
      setScoreA(data.scoreA);
      setScoreB(data.scoreB);
      setRopeOffset(data.ropeOffset);
    });

    socket.on('errorMessage', ({ message }) => {
      alert(message || 'Đã xảy ra lỗi.');
    });

    socket.on('roomResetByAdmin', ({ message }) => {
      alert(message || 'Ban Tổ Chức đã làm mới phòng.');
      handleLogout();
    });

    // Heartbeat ping from server for RTT calculation
    socket.on('ping', ({ id, ts }) => {
      const ping = Date.now() - ts;
      if (ping >= 0 && ping < 2000) setPingMs(ping);
      socket.emit('pong', { id, clientSendTs: Date.now() });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleRegister = async (formData) => {
    const res = await registerPlayer(formData);
    const token = res.sessionToken;
    const p = res.player;
    const chosenTeam = formData.preferredTeam || 'A';
    const roomCode = (formData.roomCode || 'KCO1').toUpperCase().trim();
    p.team = chosenTeam;

    setSessionToken(token);
    setPlayer(p);
    sessionStorage.setItem('keoco_token', token);
    sessionStorage.setItem('keoco_player', JSON.stringify(p));
    sessionStorage.setItem('keoco_roomCode', roomCode);

    // Join the room specified by student
    socket.emit('joinRoom', {
      roomCode,
      sessionToken: token,
      preferredTeam: chosenTeam
    });
    setCurrentPage('LOBBY');
  };

  const handleSwitchTeam = (team) => {
    socket.emit('switchTeam', { team });
    setPlayer(prev => ({ ...prev, team, isReady: false }));
  };

  const handleToggleReady = () => {
    if (!player) return;
    const nextReady = !player.isReady;
    socket.emit('setReady', { isReady: nextReady });
    setPlayer(prev => ({ ...prev, isReady: nextReady }));
  };

  const handleQuickMatch = async () => {
    try {
      const res = await quickMatch();
      socket.emit('joinRoom', {
        roomCode: res.roomCode,
        sessionToken: sessionTokenRef.current,
        preferredTeam: playerRef.current?.team || 'A'
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinByCode = (code) => {
    const rCode = code.toUpperCase().trim();
    sessionStorage.setItem('keoco_roomCode', rCode);
    socket.emit('joinRoom', {
      roomCode: rCode,
      sessionToken: sessionTokenRef.current,
      preferredTeam: playerRef.current?.team || 'A'
    });
  };

  const handleCreateRoom = (customCode) => {
    const code = customCode || 'P' + Math.floor(100 + Math.random() * 900);
    const oldCode = sessionStorage.getItem('keoco_roomCode') || roomStateRef.current?.roomCode;
    if (oldCode && oldCode !== code) {
      socket.emit('leaveRoom', { roomCode: oldCode });
    }
    sessionStorage.setItem('keoco_roomCode', code);
    socket.emit('joinRoom', {
      roomCode: code,
      sessionToken: sessionTokenRef.current,
      preferredTeam: playerRef.current?.team || 'A'
    });
  };

  const handleLogout = () => {
    const rCode = sessionStorage.getItem('keoco_roomCode') || roomStateRef.current?.roomCode || 'KCO1';
    socket.emit('leaveRoom', { roomCode: rCode });
    sessionStorage.removeItem('keoco_player');
    sessionStorage.removeItem('keoco_token');
    sessionStorage.removeItem('keoco_roomCode');
    localStorage.removeItem('keoco_player');
    localStorage.removeItem('keoco_token');
    localStorage.removeItem('keoco_roomCode');
    setPlayer(null);
    setSessionToken('');
    setRoomState(null);
    setCurrentQuestion(null);
    setGameOverData(null);
    setCurrentPage('REGISTER');
  };

  const handleAddBot = () => {
    const curPlayer = playerRef.current;
    const rCode = roomStateRef.current?.roomCode || 'KCO1';
    socket.emit('addBot', {
      roomCode: rCode,
      targetTeam: curPlayer?.team === 'A' ? 'B' : 'A'
    });
  };

  const handlePressBuzzer = () => {
    if (uiStateRef.current !== 'QUESTION_WAITING') return;
    socket.emit('pressBuzzer', { roomCode: roomStateRef.current?.roomCode || 'KCO1' });
  };

  const handleSubmitAnswer = (answerIndex) => {
    socket.emit('submitAnswer', {
      roomCode: roomStateRef.current?.roomCode || 'KCO1',
      answerIndex
    });
  };

  const handleRematch = () => {
    socket.emit('requestRematch', { roomCode: roomStateRef.current?.roomCode || 'KCO1' });
  };

  return (
    <div className="app-wrapper">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand-box">
          <span style={{ fontSize: '1.4rem' }}>⚔️</span>
          <div>
            <div className="brand-title">
              <span className="full-title">KÉO CO TRI THỨC</span>
              <span className="short-title">⚡ KÉO CO VHU</span>
            </div>
            <div className="booth-tag">{BOOTH_LABEL}</div>
          </div>
        </div>

        <div className="header-actions">
          {player && (
            <>
              <span
                style={{
                  fontSize: isMobile ? '0.72rem' : '0.78rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-title)',
                  padding: isMobile ? '2px 6px' : '3px 8px',
                  borderRadius: 999,
                  background: player.team === 'A' ? '#E0F2FE' : '#FFEDD5',
                  color: player.team === 'A' ? '#0284C7' : '#EA580C',
                  border: '1.5px solid var(--comic-black)',
                  boxShadow: '0 2px 0 var(--comic-black)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {player.team === 'A' ? (isMobile ? '⚡A' : '⚡ ĐỘI A') : (isMobile ? '🔥B' : '🔥 ĐỘI B')}
              </span>
              <button
                onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn rời trận đấu để đổi thông tin hoặc vào phòng khác?')) {
                    handleLogout();
                  }
                }}
                title="Đăng xuất / Đổi tài khoản sinh viên"
                id="header-logout-btn"
                style={{
                  background: '#FEE2E2',
                  border: '1.5px solid var(--comic-black)',
                  boxShadow: '0 2px 0 var(--comic-black)',
                  color: '#DC2626',
                  padding: isMobile ? '3px 6px' : '4px 8px',
                  borderRadius: 999,
                  cursor: 'pointer',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  flexShrink: 0
                }}
              >
                <span>🚪</span>
                <span className="header-btn-text">Thoát</span>
              </button>
            </>
          )}

          {/* Chỉ hiển thị nút BTC khi đang ở trang ADMIN hoặc có cờ admin trên URL */}
          {(currentPage === 'ADMIN' || window.location.hash === '#admin' || window.location.search.includes('admin')) && (
            <button
              onClick={() => setCurrentPage(currentPage === 'ADMIN' ? (player ? 'LOBBY' : 'REGISTER') : 'ADMIN')}
              style={{
                background: currentPage === 'ADMIN' ? '#E4E5FF' : '#FEF08A',
                border: '1.5px solid var(--comic-black)',
                boxShadow: '0 2px 0 var(--comic-black)',
                color: currentPage === 'ADMIN' ? '#1011B8' : '#713F12',
                padding: isMobile ? '3px 6px' : '4px 8px',
                borderRadius: 999,
                cursor: 'pointer',
                fontSize: '0.76rem',
                fontWeight: 900,
                fontFamily: 'var(--font-title)',
                flexShrink: 0
              }}
            >
              {currentPage === 'ADMIN' ? '🎮 Game' : '🏛️ BTC'}
            </button>
          )}
          {/* Nút Bật/Tắt Âm Thanh & Nhạc Game (Dynamic BGM Mute Toggle) */}
          <button
            onClick={() => {
              unlockAudio();
              const next = toggleMute();
              setAudioMuted(next);
            }}
            title={audioMuted ? "Bật âm thanh & nhạc game" : "Tắt âm thanh & nhạc game (Mute)"}
            id="audio-mute-toggle-btn"
            style={{
              background: audioMuted ? '#FEE2E2' : '#DCFCE7',
              border: '1.5px solid var(--comic-black)',
              boxShadow: '0 2px 0 var(--comic-black)',
              color: audioMuted ? '#DC2626' : '#15803D',
              padding: isMobile ? '3px 6px' : '4px 8px',
              borderRadius: 999,
              cursor: 'pointer',
              fontSize: '0.76rem',
              fontWeight: 900,
              fontFamily: 'var(--font-title)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              flexShrink: 0
            }}
          >
            <span>{audioMuted ? '🔇' : '🔊'}</span>
            <span className="header-btn-text">{audioMuted ? 'TẮT ÂM' : 'BẬT NHẠC'}</span>
          </button>

          {/* Nút Bật/Tắt Giọng MC Gameshow (Voice Announcer Toggle) */}
          <button
            onClick={() => {
              const next = toggleVoiceMute();
              setVoiceMutedState(next);
            }}
            title={voiceMuted ? "Bật giọng MC Gameshow" : "Tắt giọng MC Gameshow (dành cho khi có MC thật)"}
            id="voice-announcer-toggle-btn"
            style={{
              background: voiceMuted ? '#FEE2E2' : '#EFF6FF',
              border: '1.5px solid var(--comic-black)',
              boxShadow: '0 2px 0 var(--comic-black)',
              color: voiceMuted ? '#DC2626' : '#1D4ED8',
              padding: isMobile ? '3px 6px' : '4px 8px',
              borderRadius: 999,
              cursor: 'pointer',
              fontSize: '0.76rem',
              fontWeight: 900,
              fontFamily: 'var(--font-title)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              flexShrink: 0
            }}
          >
            <span>{voiceMuted ? '🔇' : '🎙️'}</span>
            <span className="header-btn-text">{voiceMuted ? 'TẮT MC' : 'MC BẬT'}</span>
          </button>

          <ConnectionBadge isConnected={isConnected} pingMs={pingMs} compact={isMobile} />
        </div>
      </header>

      {/* Reconnecting alert banner */}
      {isReconnecting && (
        <div className="reconnect-banner">
          ⚠️ Đang kết nối lại máy chủ... Vui lòng giữ nguyên màn hình!
        </div>
      )}

      {/* Pages Switcher */}
      {currentPage === 'REGISTER' && (
        <RegisterPage
          onRegisterSuccess={handleRegister}
          onGoAdmin={() => setCurrentPage('ADMIN')}
        />
      )}

      {currentPage === 'LOBBY' && (
        <LobbyPage
          player={player}
          roomState={roomState}
          onSwitchTeam={handleSwitchTeam}
          onToggleReady={handleToggleReady}
          onQuickMatch={handleQuickMatch}
          onJoinRoomByCode={handleJoinByCode}
          onCreateRoom={handleCreateRoom}
          onAddBot={handleAddBot}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'GAME' && (
        <GamePage
          scoreA={scoreA}
          scoreB={scoreB}
          ropeOffset={ropeOffset}
          currentQuestion={currentQuestion}
          deadline={deadline}
          uiState={uiState}
          buzzerData={buzzerData}
          reboundData={reboundData}
          lastResult={lastResult}
          countdown={countdown}
          gameOverData={gameOverData}
          roomState={roomState}
          onPressBuzzer={handlePressBuzzer}
          onSubmitAnswer={handleSubmitAnswer}
          onRematch={handleRematch}
        />
      )}

      {currentPage === 'ADMIN' && (
        <AdminPage onBackToGame={() => setCurrentPage(player ? 'LOBBY' : 'REGISTER')} />
      )}

      {/* Global Face-Off 3-2-1 Countdown Overlay */}
      {(countdown !== null || (typeof window !== 'undefined' && window.location.hash === '#countdown')) && (
        <CountdownOverlay
          seconds={countdown !== null ? countdown : 3}
          roomState={roomState}
          player={player}
        />
      )}
    </div>
  );
}
