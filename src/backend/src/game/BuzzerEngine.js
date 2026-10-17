/**
 * BuzzerEngine - Công bằng khi bấm chuông có bù RTT
 * Theo đặc tả Mục IV.4 của kehoach.docx:
 * 1. Đo RTT trung bình trượt của từng socket
 * 2. Mở cửa sổ chốt 120ms khi nhận tín hiệu đầu tiên
 * 3. Ước lượng thời điểm bấm thật: t_press = t_server_nhan - min(RTT/2, 150ms)
 * 4. Chọn người thắng có t_press nhỏ nhất, khóa chuông toàn bộ
 */
class BuzzerEngine {
  constructor() {
    this.rttMap = new Map(); // socketId -> moving average RTT in ms
    this.reset();
  }

  reset() {
    this.pendingBuzzes = [];
    this.isWindowOpen = false;
    this.lockWindowTimer = null;
    this.awardedBuzz = null;
  }

  updateRTT(socketId, roundTripTimeMs) {
    const current = this.rttMap.get(socketId) || roundTripTimeMs;
    // Moving average (0.7 old + 0.3 new)
    const smoothed = Math.round(current * 0.7 + roundTripTimeMs * 0.3);
    this.rttMap.set(socketId, smoothed);
  }

  removePlayer(socketId) {
    this.rttMap.delete(socketId);
  }

  registerBuzz({ socketId, team, playerName }, onAwarded) {
    const serverTime = Date.now();
    const rtt = this.rttMap.get(socketId) || 50;
    const rttHalfCap = Math.min(Math.round(rtt / 2), 150);
    const estimatedPressTime = serverTime - rttHalfCap;

    const buzzEntry = {
      socketId,
      team,
      playerName,
      serverTime,
      rtt,
      estimatedPressTime
    };

    if (this.awardedBuzz) {
      // Already decided, ignore subsequent buzzes
      return;
    }

    this.pendingBuzzes.push(buzzEntry);

    if (!this.isWindowOpen) {
      this.isWindowOpen = true;
      // Open 120ms window to collect other team's simultaneous buzz
      this.lockWindowTimer = setTimeout(() => {
        this.resolveWindow(onAwarded);
      }, 120);
    }
  }

  resolveWindow(onAwarded) {
    this.isWindowOpen = false;
    if (this.pendingBuzzes.length === 0) return;

    // Sort by estimated real press time
    this.pendingBuzzes.sort((a, b) => {
      const diff = a.estimatedPressTime - b.estimatedPressTime;
      // If difference is less than 10ms, tie-breaker: server arrival time
      if (Math.abs(diff) < 10) {
        return a.serverTime - b.serverTime;
      }
      return diff;
    });

    this.awardedBuzz = this.pendingBuzzes[0];
    if (typeof onAwarded === 'function') {
      onAwarded(this.awardedBuzz);
    }
  }
}

module.exports = BuzzerEngine;
