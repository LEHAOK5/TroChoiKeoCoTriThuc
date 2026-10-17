import React, { useState, useEffect, useRef } from 'react';
import { socket } from './services/socket';
import { registerPlayer, quickMatch } from './services/api';
import ConnectionBadge from './components/ConnectionBadge';
import RegisterPage from './pages/RegisterPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import AdminPage from './pages/admin/AdminPage';
import {
  playBuzzer,
  playCorrect,
  playWrong,
  playRopePull,
  playCountdown
} from './utils/audio';
import { BOOTH_LABEL } from './config/env';

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    if (window.location.hash === '#admin' || window.location.search.includes('admin')) return 'ADMIN';
    return 'REGISTER';
  });
  const [isConnected, setIsConnected] = useState(false);
  const [pingMs, setPingMs] = useState(25);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Player & Session (Isolated per browser tab using sessionStorage)
  const [player, setPlayer] = useState(() => {
    try {
      const saved = sessionStorage.getItem('keoco_player');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [sessionToken, setSessionToken] = useState(() => sessionStorage.getItem('keoco_token') || '');

  // Room & Battle States
  const [roomState, setRoomState] = useState(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [ropeOffset, setRopeOffset] = useState(0);
  const [countdown, setCountdown] = useState(null);

  // In-Game UI state: 'QUESTION_WAITING', 'BUZZER_SELF', 'BUZZER_OPPONENT', 'STEAL_PHASE', 'LOCKED'
  const [uiState, setUiState] = useState('QUESTION_WAITING');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [deadline, setDeadline] = useState(null);
  const [buzzerData, setBuzzerData] = useState(null);
  const [reboundData, setReboundData] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);

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
      if (seconds <= 0) {
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
    });

    socket.on('buzzerAwarded', (data) => {
      playBuzzer();
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
      } else {
        playWrong();
      }
    });

    socket.on('reboundOpen', (data) => {
      playWrong();
      setReboundData(data);
      setDeadline(data.deadline);

      const curPlayer = playerRef.current;
      const isMyRebound = curPlayer && curPlayer.team === data.reboundTeam;
      setUiState(isMyRebound ? 'STEAL_PHASE' : 'BUZZER_OPPONENT');
    });

    socket.on('bothTeamsWrong', (data) => {
      playWrong();
      setLastResult(data);
      setUiState('LOCKED');
    });

    socket.on('gameOver', (data) => {
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
            <div className="brand-title">KÉO CO TRI THỨC</div>
            <div className="booth-tag">{BOOTH_LABEL}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {player && (
            <>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 12,
                  background: player.team === 'A' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 107, 0, 0.15)',
                  color: player.team === 'A' ? 'var(--team-a-cyan)' : 'var(--team-b-orange)',
                  border: `1px solid ${player.team === 'A' ? 'var(--team-a-cyan)' : 'var(--team-b-orange)'}`
                }}
              >
                {player.team === 'A' ? '⚡ ĐỘI A' : '🔥 ĐỘI B'}
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
                  background: 'rgba(255, 23, 68, 0.12)',
                  border: '1px solid rgba(255, 23, 68, 0.4)',
                  color: '#FF5252',
                  padding: '4px 10px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                🚪 Thoát
              </button>
            </>
          )}

          {/* Chỉ hiển thị nút BTC khi đang ở trang ADMIN hoặc có cờ admin trên URL */}
          {(currentPage === 'ADMIN' || window.location.hash === '#admin' || window.location.search.includes('admin')) && (
            <button
              onClick={() => setCurrentPage(currentPage === 'ADMIN' ? (player ? 'LOBBY' : 'REGISTER') : 'ADMIN')}
              style={{
                background: currentPage === 'ADMIN' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 215, 0, 0.15)',
                border: currentPage === 'ADMIN' ? '1px solid var(--team-a-cyan)' : '1px solid var(--color-steal)',
                color: currentPage === 'ADMIN' ? 'var(--team-a-cyan)' : 'var(--color-steal)',
                padding: '4px 10px',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 800
              }}
            >
              {currentPage === 'ADMIN' ? '🎮 Quay lại Game' : '🏛️ Quản trị BTC'}
            </button>
          )}
          <ConnectionBadge isConnected={isConnected} pingMs={pingMs} />
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
    </div>
  );
}
