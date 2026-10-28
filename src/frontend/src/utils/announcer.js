// =====================================================================
// KÉO CO TRI THỨC - GAMESHOW VOICE ANNOUNCER ENGINE (AI VIETNAMESE AUDIO)
// 100% Giọng AI Tiếng Việt Gameshow Nam Minh (Neural Voice) Chuẩn Xác
// =====================================================================

import { isMuted } from './audio';

let isVoiceMutedState = false;
try {
  isVoiceMutedState = localStorage.getItem('keoco_voice_muted') === 'true';
} catch (e) {
  isVoiceMutedState = false;
}

const voiceListeners = new Set();
let currentAudio = null;

export function isVoiceMuted() {
  return isVoiceMutedState || isMuted();
}

export function setVoiceMuted(muted) {
  isVoiceMutedState = Boolean(muted);
  try {
    localStorage.setItem('keoco_voice_muted', isVoiceMutedState ? 'true' : 'false');
  } catch (e) {}

  if (isVoiceMutedState && currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (e) {}
  }

  voiceListeners.forEach(fn => {
    try { fn(isVoiceMutedState); } catch (e) {}
  });

  return isVoiceMutedState;
}

export function toggleVoiceMute() {
  return setVoiceMuted(!isVoiceMutedState);
}

export function subscribeVoiceMute(listener) {
  voiceListeners.add(listener);
  return () => voiceListeners.delete(listener);
}

// Bảng ánh xạ các file âm thanh giọng đọc AI tiếng Việt chuẩn
const AUDIO_CLIPS = {
  start: '/audio/announcer/start.mp3',             // "Sẵn sàng... Bắt đầu!"
  buzzer_a: '/audio/announcer/buzzer_a.mp3',       // "Đội A đã cướp chuông!"
  buzzer_b: '/audio/announcer/buzzer_b.mp3',       // "Đội B đã cướp chuông!"
  correct: '/audio/announcer/correct.mp3',         // "Chính xác tuyệt đối!"
  wrong: '/audio/announcer/wrong.mp3',             // "Quá tiếc nuối!"
  victory: '/audio/announcer/victory.mp3',         // "Vô địch rồi!"
  rebound_a: '/audio/announcer/rebound_a.mp3',     // "Cơ hội cướp điểm cho Đội A!"
  rebound_b: '/audio/announcer/rebound_b.mp3',     // "Cơ hội cướp điểm cho Đội B!"
  both_wrong: '/audio/announcer/both_wrong.mp3',   // "Cả hai đội đều chưa chính xác!"
  match_point: '/audio/announcer/match_point.mp3'  // "Điểm quyết định!"
};

// Cache các đối tượng Audio để phát ngay lập tức không bị delay
const audioCache = {};

function getOrCreateAudio(clipKey) {
  const src = AUDIO_CLIPS[clipKey];
  if (!src) return null;
  if (!audioCache[clipKey]) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audioCache[clipKey] = audio;
  }
  return audioCache[clipKey];
}

// Preload tất cả các file âm thanh khi ứng dụng khởi chạy
if (typeof window !== 'undefined') {
  Object.keys(AUDIO_CLIPS).forEach(key => {
    try {
      getOrCreateAudio(key);
    } catch (e) {}
  });
}

function playClip(clipKey, volume = 1.0) {
  if (isVoiceMuted()) return;
  if (typeof window === 'undefined') return;

  try {
    // Ngắt câu đọc cũ nếu đang phát để nhường chỗ cho câu mới
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const audio = getOrCreateAudio(clipKey);
    if (audio) {
      audio.currentTime = 0;
      audio.volume = volume;
      currentAudio = audio;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Xử lý tự động khi trình duyệt yêu cầu tương tác đầu tiên
        });
      }
    }
  } catch (err) {
    // Im lặng bỏ qua nếu có lỗi phát sinh
  }
}

// =====================================================================
// BỘ CÂU VOICE ANNOUNCER TIẾNG VIỆT THEO YÊU CẦU NGƯỜI DÙNG
// =====================================================================

// 0. Đếm ngược 3 - 2 - 1 và Bắt đầu
export function announceCountdownNumber(num) {
  if (isVoiceMuted()) return;
  if (typeof window === 'undefined') return;

  if (num === 0) {
    playClip('start', 1.0);
    return;
  }

  const numberWords = {
    3: 'Ba!',
    2: 'Hai!',
    1: 'Một!'
  };

  const word = numberWords[num];
  if (!word) return;

  if (window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.15;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(v => (v.lang === 'vi-VN' || v.lang === 'vi_VN' || v.lang === 'vi'));
      if (viVoice) {
        utterance.voice = viVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // ignore
    }
  }
}

// 1. "Sẵn sàng... Bắt đầu!"
export function announceStart() {
  playClip('start', 1.0);
}

// 2. "Đội A đã cướp chuông!" / "Đội B đã cướp chuông!"
export function announceBuzzer(team = 'A') {
  if (team === 'B') {
    playClip('buzzer_b', 1.0);
  } else {
    playClip('buzzer_a', 1.0);
  }
}

// 3. "Chính xác tuyệt đối!"
export function announceCorrect() {
  playClip('correct', 1.0);
}

// 4. "Quá tiếc nuối!"
export function announceWrong() {
  playClip('wrong', 1.0);
}

// 5. "Vô địch rồi!"
export function announceVictory() {
  playClip('victory', 1.0);
}

// 6. "Cơ hội cướp điểm cho Đội [A/B]!"
export function announceRebound(reboundTeam = 'B') {
  if (reboundTeam === 'A') {
    playClip('rebound_a', 1.0);
  } else {
    playClip('rebound_b', 1.0);
  }
}

// 7. "Cả hai đội đều chưa chính xác!"
export function announceBothWrong() {
  playClip('both_wrong', 1.0);
}

// 8. "Điểm quyết định!"
export function announceMatchPoint() {
  playClip('match_point', 1.0);
}
