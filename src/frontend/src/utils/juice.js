import { triggerHaptic } from './haptics';
import { playCorrect, playWrong, playBuzzer, playRopePull, playMatchPoint, playRebound } from './audio';

export function triggerScreenShake(duration = 160) {
  const el = document.querySelector('.game-layout') || document.body;
  if (!el) return;

  el.classList.remove('screen-shake-anim');
  void el.offsetWidth; // force reflow
  el.classList.add('screen-shake-anim');

  setTimeout(() => {
    el.classList.remove('screen-shake-anim');
  }, duration);
}

// Spark / Dust Particles on pull
export function triggerPullParticles(team = 'A') {
  const arena = document.querySelector('.arena-card');
  if (!arena) return;

  const count = 12;
  const rect = arena.getBoundingClientRect();
  const originX = team === 'A' ? rect.left + 60 : rect.right - 60;
  const originY = rect.top + rect.height * 0.7;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = `spark-particle ${team === 'A' ? 'spark-cyan' : 'spark-orange'}`;
    
    const angle = (Math.random() * Math.PI) - (team === 'A' ? 0.3 : 2.8);
    const speed = 40 + Math.random() * 80;
    const destX = Math.cos(angle) * speed;
    const destY = (Math.random() * -40) - 10;

    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;
    particle.style.setProperty('--dx', `${destX}px`);
    particle.style.setProperty('--dy', `${destY}px`);

    document.body.appendChild(particle);
    setTimeout(() => {
      particle.remove();
    }, 550);
  }
}

export const Juice = {
  onBuzzerSelf: () => {
    triggerHaptic([40, 30, 80]);
    playBuzzer();
  },
  onBuzzerOpponent: () => {
    triggerHaptic(30);
  },
  onCorrect: (team) => {
    triggerHaptic([50, 40, 90]);
    playCorrect();
    playRopePull();
    triggerScreenShake(180);
    triggerPullParticles(team);
  },
  onWrong: () => {
    triggerHaptic(120);
    playWrong();
    triggerScreenShake(120);
  },
  onStealOpen: () => {
    triggerHaptic([60, 40]);
    playRebound();
  },
  onMatchPoint: () => {
    triggerHaptic([80, 50, 100]);
    playMatchPoint();
    triggerScreenShake(100);
  }
};
