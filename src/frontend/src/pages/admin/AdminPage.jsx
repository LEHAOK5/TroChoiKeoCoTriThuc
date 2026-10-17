import React, { useState, useEffect } from 'react';
import { adminLogin, getAdminStats, getAdminRooms, adminCreateRoom, adminStartMatch, adminResetRoom, adminCloseRoom } from '../../services/api';
import { API_URL } from '../../config/env';

const MODES = [
  { id: '1vs1', label: '🥊 1 vs 1', desc: '1 người vs 1 người (Đủ 2 người)', max: 1 },
  { id: '2vs2', label: '👥 2 vs 2', desc: '2 người vs 2 người (Đủ 4 người)', max: 2 },
  { id: '3vs3', label: '⚡ 3 vs 3', desc: '3 người vs 3 người (Đủ 6 người)', max: 3 },
  { id: '4vs4', label: '🛡️ 4 vs 4', desc: '4 người vs 4 người (Đủ 8 người)', max: 4 },
  { id: '5vs5', label: '🔥 5 vs 5', desc: '5 người vs 5 người (Đủ 10 người)', max: 5 },
];

export default function AdminPage({ onBackToGame }) {
  const [token, setToken] = useState(sessionStorage.getItem('adminToken') || '');
  const [adminUser, setAdminUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('adminUser')) || null;
    } catch {
      return null;
    }
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Room Creation & QR State
  const [selectedMode, setSelectedMode] = useState('2vs2');
  const [customCode, setCustomCode] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [viewingQr, setViewingQr] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const isAuthenticated = Boolean(token);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      const interval = setInterval(loadRoomsOnly, 2500);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  const loadData = async () => {
    try {
      const [sRes, rRes] = await Promise.all([
        getAdminStats(token),
        getAdminRooms(token)
      ]);
      setStats(sRes.stats);
      setRooms(rRes.rooms || []);
    } catch (err) {
      console.error(err);
      if (err.message.includes('không hợp lệ')) {
        handleLogout();
      }
    }
  };

  const loadRoomsOnly = async () => {
    try {
      const rRes = await getAdminRooms(token);
      setRooms(rRes.rooms || []);
    } catch (err) {
      // silent polling error
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await adminLogin(username.trim(), password);
      sessionStorage.setItem('adminToken', res.token);
      sessionStorage.setItem('adminUser', JSON.stringify(res.admin));
      setToken(res.token);
      setAdminUser(res.admin);
      setSuccessMsg('Đăng nhập thành công!');
      setPassword('');
    } catch (err) {
      setErrorMsg(err.message || 'Tài khoản hoặc mật khẩu không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
    setToken('');
    setAdminUser(null);
    setUsername('');
    setPassword('');
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setCreatingRoom(true);
    try {
      const res = await adminCreateRoom({ mode: selectedMode, customCode: customCode || null }, token);
      setSuccessMsg(`Đã tạo thành công phòng #${res.room.roomCode} (${res.room.mode})! Cung cấp mã này cho sinh viên.`);
      setCustomCode('');
      await loadRoomsOnly();
    } catch (err) {
      setErrorMsg(err.message || 'Không thể tạo phòng');
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleStartMatch = async (roomCode) => {
    setActionLoading(prev => ({ ...prev, [roomCode]: true }));
    try {
      await adminStartMatch(roomCode, token);
      setSuccessMsg(`Đã phát lệnh bắt đầu trận đấu cho phòng #${roomCode}!`);
      await loadRoomsOnly();
    } catch (err) {
      alert(err.message || 'Không thể bắt đầu trận đấu');
    } finally {
      setActionLoading(prev => ({ ...prev, [roomCode]: false }));
    }
  };

  const handleResetRoom = async (roomCode) => {
    if (!window.confirm(`Làm mới phòng #${roomCode} để đón lượt sinh viên mới? Điểm số sẽ về 0-0 và người cũ sẽ được rời phòng.`)) return;
    try {
      await adminResetRoom(roomCode, token);
      setSuccessMsg(`Đã làm mới phòng #${roomCode} để sẵn sàng đón tốp sinh viên tiếp theo!`);
      await loadRoomsOnly();
    } catch (err) {
      alert(err.message || 'Không thể làm mới phòng');
    }
  };

  const handleCloseRoom = async (roomCode) => {
    if (!window.confirm(`Bạn có chắc muốn đóng phòng #${roomCode}?`)) return;
    try {
      await adminCloseRoom(roomCode, token);
      await loadRoomsOnly();
    } catch (err) {
      alert(err.message || 'Không thể đóng phòng');
    }
  };

  const handleCopyLink = (roomCode) => {
    const link = `${window.location.origin}/?room=${roomCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(roomCode);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadCsv = () => {
    window.open(`${API_URL}/api/admin/registrations?format=csv&token=${token}`, '_blank');
  };

  return (
    <div style={{ maxWidth: 1000, margin: '20px auto', padding: '0 16px', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>
            🏛️ BẢNG ĐIỀU KHIỂN BAN TỔ CHỨC
          </h1>
          {adminUser && (
            <div style={{ fontSize: '0.85rem', color: 'var(--team-a-cyan)', marginTop: 4 }}>
              👤 Đăng nhập: <strong>{adminUser.full_name}</strong> ({adminUser.role})
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              style={{ background: 'rgba(255, 23, 68, 0.2)', border: '1px solid #FF1744', color: '#FF1744', padding: '8px 14px', borderRadius: 12, cursor: 'pointer', fontWeight: 700 }}
            >
              Đăng xuất 🚪
            </button>
          )}
          <button
            onClick={onBackToGame}
            style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#FFF', padding: '8px 16px', borderRadius: 12, cursor: 'pointer', fontWeight: 700 }}
          >
            ← Quay lại Game
          </button>
        </div>
      </div>

      {!isAuthenticated ? (
        /* Login Form */
        <form
          onSubmit={handleLogin}
          style={{
            maxWidth: 440,
            margin: '40px auto',
            background: 'var(--glass-surface)',
            border: 'var(--glass-border)',
            borderRadius: 20,
            padding: 30,
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔐</div>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.35rem', marginBottom: 6 }}>
            ĐĂNG NHẬP BAN TỔ CHỨC
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            Quyền tạo phòng thi đấu và giám sát sự kiện được bảo mật bởi Supabase
          </p>

          {errorMsg && (
            <div style={{ background: 'rgba(255, 23, 68, 0.15)', border: '1px solid #FF1744', color: '#FF5252', padding: 10, borderRadius: 10, fontSize: '0.85rem', marginBottom: 16 }}>
              {errorMsg}
            </div>
          )}

          <div style={{ textAlign: 'left', marginBottom: 14 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 700 }}>
              TÀI KHOẢN ADMIN:
            </label>
            <input
              type="text"
              required
              autoComplete="off"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Nhập tài khoản Admin..."
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 12,
                color: '#FFF',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div style={{ textAlign: 'left', marginBottom: 20 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 700 }}>
              MẬT KHẨU:
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 12,
                color: '#FFF',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-tactile"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'var(--team-a-gradient)',
              color: '#0B132B',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP QUẢN TRỊ 🚀'}
          </button>
        </form>
      ) : (
        /* Authenticated Dashboard */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Notification Messages */}
          {successMsg && (
            <div style={{ background: 'rgba(0, 230, 118, 0.15)', border: '1px solid #00E676', color: '#00E676', padding: '12px 16px', borderRadius: 12, fontSize: '0.9rem', fontWeight: 600 }}>
              ✅ {successMsg}
            </div>
          )}
          {errorMsg && (
            <div style={{ background: 'rgba(255, 23, 68, 0.15)', border: '1px solid #FF1744', color: '#FF5252', padding: '12px 16px', borderRadius: 12, fontSize: '0.9rem', fontWeight: 600 }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <div style={{ background: 'var(--glass-surface)', border: 'var(--glass-border)', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TỔNG ĐĂNG KÝ</div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 900, color: 'var(--team-a-cyan)' }}>
                {stats?.totalRegistrations || 0}
              </div>
              <small style={{ color: 'var(--text-dim)' }}>Sinh viên tại gian hàng</small>
            </div>

            <div style={{ background: 'var(--glass-surface)', border: 'var(--glass-border)', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>NGÂN HÀNG CÂU HỎI</div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 900, color: 'var(--color-steal)' }}>
                {stats?.totalQuestions || 0}
              </div>
              <small style={{ color: 'var(--text-dim)' }}>{stats?.questionsIT || 0} IT + {stats?.questionsLAW || 0} Luật</small>
            </div>

            <div style={{ background: 'var(--glass-surface)', border: 'var(--glass-border)', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TRẬN ĐÃ ĐẤU</div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 900, color: '#00E676' }}>
                {stats?.totalMatches || 0}
              </div>
              <small style={{ color: 'var(--text-dim)' }}>Thắng A: {stats?.winsA || 0} | Thắng B: {stats?.winsB || 0}</small>
            </div>

            <div style={{ background: 'var(--glass-surface)', border: 'var(--glass-border)', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>PHÒNG ĐANG MỞ</div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 900, color: 'var(--team-b-orange)' }}>
                {rooms.length}
              </div>
              <small style={{ color: 'var(--text-dim)' }}>Tự động cập nhật 2.5s</small>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadCsv}
              className="btn-tactile"
              style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #00E676 0%, #0099FF 100%)', color: '#0B132B', fontSize: '0.9rem', fontWeight: 800 }}
            >
              📥 Xuất Danh Sách Sinh Viên (CSV)
            </button>
            <button
              onClick={loadData}
              style={{ padding: '10px 16px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#FFF', borderRadius: 12, cursor: 'pointer', fontWeight: 700 }}
            >
              Làm mới ngay 🔄
            </button>
          </div>

          {/* SECTION: TẠO PHÒNG ĐẤU MỚI (BTC QUẢN LÝ) */}
          <div style={{ background: 'var(--glass-surface)', border: '2px solid rgba(0, 240, 255, 0.3)', borderRadius: 20, padding: 24, boxShadow: '0 8px 32px rgba(0, 240, 255, 0.08)' }}>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', color: 'var(--team-a-cyan)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>➕</span> TẠO PHÒNG ĐẤU MỚI CHO GIAN HÀNG
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 18 }}>
              Chọn chế độ phù hợp với số lượng sinh viên đang xếp hàng tại quầy. Sinh viên sẽ nhập mã phòng này để tham gia.
            </p>

            <form onSubmit={handleCreateRoom}>
              {/* Mode Selector */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFF', display: 'block', marginBottom: 10 }}>
                  CHỌN CHẾ ĐỘ THI ĐẤU:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                  {MODES.map(m => {
                    const isSelected = selectedMode === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMode(m.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 14,
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                          border: isSelected ? '2px solid var(--team-a-cyan)' : '1px solid rgba(255, 255, 255, 0.12)',
                          boxShadow: isSelected ? '0 0 16px rgba(0, 240, 255, 0.25)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: isSelected ? 'var(--team-a-cyan)' : '#FFF', marginBottom: 4 }}>
                          {m.label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: isSelected ? '#FFF' : 'var(--text-muted)' }}>
                          {m.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional Custom Room Code */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 14 }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    MÃ PHÒNG TÙY CHỌN (Để trống hệ thống tự sinh 4 số ngẫu nhiên như 8291):
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Ví dụ: 8291"
                    value={customCode}
                    onChange={e => setCustomCode(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 12,
                      color: 'var(--color-steal)',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      letterSpacing: 2
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingRoom}
                  className="btn-tactile"
                  style={{
                    padding: '14px 28px',
                    background: 'var(--team-a-gradient)',
                    color: '#0B132B',
                    fontSize: '1rem',
                    fontWeight: 900,
                    borderRadius: 12,
                    cursor: creatingRoom ? 'not-allowed' : 'pointer'
                  }}
                >
                  {creatingRoom ? 'Đang tạo...' : 'TẠO PHÒNG ĐẤU NGAY 🚀'}
                </button>
              </div>
            </form>
          </div>

          {/* SECTION: DANH SÁCH PHÒNG ĐẤU ĐANG CHẠY (REAL-TIME CARDS) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', margin: 0 }}>
                🔴 CÁC PHÒNG ĐẤU ĐANG HOẠT ĐỘNG ({rooms.length})
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Đồng bộ trực tiếp với màn hình sinh viên
              </span>
            </div>

            {rooms.length === 0 ? (
              <div style={{ background: 'var(--glass-surface)', border: 'var(--glass-border)', borderRadius: 16, padding: 30, textAlign: 'center', color: 'var(--text-dim)' }}>
                Chưa có phòng nào được tạo. Hãy bấm "TẠO PHÒNG ĐẤU NGAY" ở trên để mở bàn thi đấu!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {rooms.map(r => {
                  const max = r.maxPerTeam || 1;
                  const isLobby = r.state === 'LOBBY';
                  const isFinished = r.state === 'FINISHED';
                  const isPlaying = !isLobby && !isFinished;

                  // Strictest business validation: MUST have reached maxPerTeam AND 100% players ready
                  const isFullTeams = r.teamACount === max && r.teamBCount === max;
                  const readyCountA = r.teamAPlayers?.filter(p => p.isReady).length || 0;
                  const readyCountB = r.teamBPlayers?.filter(p => p.isReady).length || 0;
                  const totalReady = readyCountA + readyCountB;
                  const targetTotal = max * 2;
                  const isAllReady = isFullTeams && readyCountA >= max && readyCountB >= max;
                  const canStart = isLobby && isFullTeams && isAllReady;
                  const roomJoinUrl = `${window.location.origin}/?room=${r.roomCode}`;

                  return (
                    <div
                      key={r.roomCode}
                      style={{
                        background: 'var(--glass-surface)',
                        border: isPlaying ? '2px solid #00E676' : isAllReady && isLobby ? '2px solid #00E676' : isFullTeams && isLobby ? '2px solid #FFAB00' : 'var(--glass-border)',
                        borderRadius: 18,
                        padding: 18,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {/* Top Bar of Room Card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12, marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            fontFamily: 'var(--font-title)',
                            fontSize: '1.8rem',
                            fontWeight: 900,
                            color: 'var(--color-steal)',
                            background: 'rgba(255, 215, 0, 0.1)',
                            border: '1px solid var(--color-steal)',
                            padding: '4px 14px',
                            borderRadius: 12,
                            letterSpacing: 2
                          }}>
                            #{r.roomCode}
                          </div>
                          <div>
                            <span style={{
                              background: 'rgba(255,255,255,0.1)',
                              padding: '4px 10px',
                              borderRadius: 8,
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              marginRight: 8
                            }}>
                              Chế độ: {r.mode || '1vs1'} ({max} vs {max})
                            </span>
                            <span style={{
                              background: isPlaying ? 'rgba(0, 230, 118, 0.2)' : isFinished ? 'rgba(255,255,255,0.1)' : isAllReady ? 'rgba(0, 230, 118, 0.2)' : isFullTeams ? 'rgba(255, 171, 0, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                              color: isPlaying ? '#00E676' : isFinished ? '#FFF' : isAllReady ? '#00E676' : isFullTeams ? '#FFAB00' : 'var(--text-muted)',
                              border: `1px solid ${isPlaying ? '#00E676' : isFinished ? '#888' : isAllReady ? '#00E676' : isFullTeams ? '#FFAB00' : 'rgba(255,255,255,0.2)'}`,
                              padding: '4px 10px',
                              borderRadius: 8,
                              fontSize: '0.78rem',
                              fontWeight: 800
                            }}>
                              {isPlaying
                                ? `⚡ ĐANG ĐẤU (Câu ${r.roundCount} | ${r.scoreA}-${r.scoreB})`
                                : isFinished
                                ? '🏆 ĐÃ KẾT THÚC'
                                : isAllReady
                                ? `✨ ĐỦ ${targetTotal}/${targetTotal} NGƯỜI SẴN SÀNG`
                                : isFullTeams
                                ? `⏳ ĐỢI SẴN SÀNG (${totalReady}/${targetTotal})`
                                : `⏳ ĐỢI NGƯỜI (ĐÃ CÓ ${r.teamACount + r.teamBCount}/${targetTotal})`}
                            </span>
                          </div>
                        </div>

                        {/* Control Actions */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* QR Code toggle */}
                          <button
                            onClick={() => setViewingQr(viewingQr === r.roomCode ? null : r.roomCode)}
                            style={{
                              background: viewingQr === r.roomCode ? 'var(--color-steal)' : 'rgba(255, 215, 0, 0.12)',
                              border: '1px solid var(--color-steal)',
                              color: viewingQr === r.roomCode ? '#0B132B' : 'var(--color-steal)',
                              padding: '8px 12px',
                              borderRadius: 10,
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 800
                            }}
                            title="Hiển thị mã QR để sinh viên quét vào phòng tức thì"
                          >
                            📱 {viewingQr === r.roomCode ? 'Đóng QR' : 'Mã QR quét'}
                          </button>

                          {/* Start Match button - STRICT VALIDATION (Must be 100% full and 100% ready) */}
                          {isLobby && (
                            <button
                              onClick={() => handleStartMatch(r.roomCode)}
                              disabled={!canStart || actionLoading[r.roomCode]}
                              className="btn-tactile"
                              style={{
                                padding: '8px 16px',
                                background: !canStart
                                  ? 'rgba(255, 255, 255, 0.05)'
                                  : 'linear-gradient(135deg, #00E676 0%, #00B0FF 100%)',
                                border: !canStart ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                color: !canStart ? '#888' : '#0B132B',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                borderRadius: 10,
                                cursor: canStart ? 'pointer' : 'not-allowed',
                                boxShadow: canStart ? '0 0 16px rgba(0, 230, 118, 0.4)' : 'none'
                              }}
                              title={
                                !isFullTeams
                                  ? `Chưa đủ người! Cần ${max} người mỗi đội (Hiện có Đội A: ${r.teamACount}/${max}, Đội B: ${r.teamBCount}/${max})`
                                  : !isAllReady
                                  ? `Đợi tất cả người chơi bấm Sẵn sàng! (${totalReady}/${targetTotal} đã sẵn sàng)`
                                  : 'Bắt đầu đếm ngược trận đấu ngay'
                              }
                            >
                              {actionLoading[r.roomCode]
                                ? 'Đang gửi lệnh...'
                                : !isFullTeams
                                ? `⏳ Đợi đủ người (A: ${r.teamACount}/${max}, B: ${r.teamBCount}/${max})`
                                : !isAllReady
                                ? `⏳ Đợi sẵn sàng (${totalReady}/${targetTotal} người)`
                                : 'BẮT ĐẦU TRẬN ĐẤU NGAY 🚀'}
                            </button>
                          )}

                          {/* Reset Room button (for new batch of students) */}
                          <button
                            onClick={() => handleResetRoom(r.roomCode)}
                            style={{
                              background: 'rgba(0, 240, 255, 0.1)',
                              border: '1px solid rgba(0, 240, 255, 0.3)',
                              color: 'var(--team-a-cyan)',
                              padding: '8px 12px',
                              borderRadius: 10,
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 700
                            }}
                            title="Làm mới phòng về sảnh chờ để đón đợt sinh viên mới"
                          >
                            🔄 Đón lượt mới
                          </button>

                          {/* Close room */}
                          <button
                            onClick={() => handleCloseRoom(r.roomCode)}
                            style={{
                              background: 'rgba(255, 23, 68, 0.1)',
                              border: '1px solid rgba(255, 23, 68, 0.4)',
                              color: '#FF5252',
                              padding: '8px 12px',
                              borderRadius: 10,
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 700
                            }}
                          >
                            Đóng ❌
                          </button>
                        </div>
                      </div>

                      {/* Expandable QR Code Scanner Card */}
                      {viewingQr === r.roomCode && (
                        <div style={{
                          background: 'rgba(0,0,0,0.4)',
                          border: '1.5px solid var(--color-steal)',
                          borderRadius: 14,
                          padding: 16,
                          marginBottom: 14,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 20,
                          flexWrap: 'wrap'
                        }}>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(roomJoinUrl)}`}
                            alt={`QR Phòng ${r.roomCode}`}
                            style={{ width: 140, height: 140, borderRadius: 10, background: '#FFF', padding: 6 }}
                          />
                          <div style={{ flex: 1, minWidth: 220 }}>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-steal)', marginBottom: 4 }}>
                              📲 MÃ QR VÀO PHÒNG #{r.roomCode}
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                              Cho sinh viên dùng camera điện thoại quét mã QR này để tự động điền sẵn mã phòng, chỉ cần nhập Tên và MSSV là vào đấu ngay!
                            </p>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <input
                                type="text"
                                readOnly
                                value={roomJoinUrl}
                                style={{
                                  flex: 1,
                                  padding: '8px 10px',
                                  background: 'rgba(255,255,255,0.06)',
                                  border: '1px solid rgba(255,255,255,0.2)',
                                  borderRadius: 8,
                                  color: '#FFF',
                                  fontSize: '0.8rem'
                                }}
                              />
                              <button
                                onClick={() => handleCopyLink(r.roomCode)}
                                style={{
                                  padding: '8px 14px',
                                  background: copiedLink === r.roomCode ? '#00E676' : 'rgba(255,255,255,0.1)',
                                  border: '1px solid rgba(255,255,255,0.3)',
                                  color: copiedLink === r.roomCode ? '#0B132B' : '#FFF',
                                  borderRadius: 8,
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                {copiedLink === r.roomCode ? 'Đã sao chép ✅' : 'Sao chép link 📋'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Teams Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                        {/* Team A */}
                        <div style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: 14, padding: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ fontWeight: 800, color: 'var(--team-a-cyan)', fontSize: '0.9rem' }}>
                              ⚡ ĐỘI A (TIA CHỚP)
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: r.teamACount >= max ? '#00E676' : 'var(--text-muted)' }}>
                              {r.teamACount} / {max} người
                            </span>
                          </div>
                          {(!r.teamAPlayers || r.teamAPlayers.length === 0) ? (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic', padding: '6px 0' }}>
                              Chưa có sinh viên nào vào Đội A...
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {r.teamAPlayers.map((p, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '6px 10px', borderRadius: 8, fontSize: '0.82rem' }}>
                                  <span>👤 <strong>{p.name}</strong> <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>({p.studentId})</span></span>
                                  <span style={{ color: p.isReady ? '#00E676' : '#FFAB00', fontWeight: 700, fontSize: '0.75rem' }}>
                                    {p.isReady ? '✅ SẴN SÀNG' : '⏳ CHỜ'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Team B */}
                        <div style={{ background: 'rgba(255, 107, 0, 0.05)', border: '1px solid rgba(255, 107, 0, 0.2)', borderRadius: 14, padding: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ fontWeight: 800, color: 'var(--team-b-orange)', fontSize: '0.9rem' }}>
                              🔥 ĐỘI B (NGỌN LỬA)
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: r.teamBCount >= max ? '#00E676' : 'var(--text-muted)' }}>
                              {r.teamBCount} / {max} người
                            </span>
                          </div>
                          {(!r.teamBPlayers || r.teamBPlayers.length === 0) ? (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic', padding: '6px 0' }}>
                              Chưa có sinh viên nào vào Đội B...
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {r.teamBPlayers.map((p, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '6px 10px', borderRadius: 8, fontSize: '0.82rem' }}>
                                  <span>👤 <strong>{p.name}</strong> <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>({p.studentId})</span></span>
                                  <span style={{ color: p.isReady ? '#00E676' : '#FFAB00', fontWeight: 700, fontSize: '0.75rem' }}>
                                    {p.isReady ? '✅ SẴN SÀNG' : '⏳ CHỜ'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
