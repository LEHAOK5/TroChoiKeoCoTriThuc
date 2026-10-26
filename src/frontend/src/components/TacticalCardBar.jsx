import React from 'react';
import { triggerHaptic } from '../utils/haptics';

export default function TacticalCardBar({
  teamCards = {},
  roundActiveCard = null,
  uiState,
  playerTeam,
  buzzerData,
  reboundData,
  onUseCard,
  isMobile = false
}) {
  // teamCards: { FIREWALL: bool, DDOS: bool, DOUBLE_PULL: bool, FIFTY_FIFTY: bool }
  const isUsed = (type) => Boolean(teamCards[type]);
  const hasUsedCardThisRound = Boolean(roundActiveCard);

  // Kiểm tra thời điểm hợp lệ của từng thẻ
  const canUseDDoS = !isUsed('DDOS') && !hasUsedCardThisRound && uiState === 'QUESTION_WAITING';
  const canUseFirewall = !isUsed('FIREWALL') && !hasUsedCardThisRound && uiState === 'BUZZER_SELF';
  const canUseDoublePull = !isUsed('DOUBLE_PULL') && !hasUsedCardThisRound && (uiState === 'QUESTION_WAITING' || uiState === 'BUZZER_SELF');
  const canUse5050 = !isUsed('FIFTY_FIFTY') && !hasUsedCardThisRound && (uiState === 'BUZZER_SELF' || uiState === 'STEAL_PHASE');

  const CARDS = [
    {
      id: 'DDOS',
      name: isMobile ? 'DDoS' : '❄️ DDoS',
      fullName: 'Tấn Công DDoS',
      icon: '❄️',
      canUse: canUseDDoS,
      used: isUsed('DDOS'),
      isActive: roundActiveCard === 'DDOS',
      bgGradient: 'linear-gradient(135deg, #BAE6FD 0%, #38BDF8 100%)',
      textColor: '#0369A1',
      desc: 'Đóng băng chuông đối thủ 2.5s'
    },
    {
      id: 'DOUBLE_PULL',
      name: isMobile ? 'X2 Kéo' : '⚖️ X2 Kéo',
      fullName: 'Kháng Cáo Tối Cao',
      icon: '⚖️',
      canUse: canUseDoublePull,
      used: isUsed('DOUBLE_PULL'),
      isActive: roundActiveCard === 'DOUBLE_PULL',
      bgGradient: 'linear-gradient(135deg, #FEF08A 0%, #EAB308 100%)',
      textColor: '#713F12',
      desc: 'Đúng +2 điểm / Sai phạt lùi dây 1 nấc'
    },
    {
      id: 'FIFTY_FIFTY',
      name: isMobile ? '50/50' : '🔍 50/50',
      fullName: 'Luật Sư Tư Vấn',
      icon: '🔍',
      canUse: canUse5050,
      used: isUsed('FIFTY_FIFTY'),
      isActive: roundActiveCard === 'FIFTY_FIFTY',
      bgGradient: 'linear-gradient(135deg, #BBF7D0 0%, #22C55E 100%)',
      textColor: '#14532D',
      desc: 'Gạch bỏ 2 đáp án sai'
    },
    {
      id: 'FIREWALL',
      name: isMobile ? 'T.Lửa' : '🛡️ Tường Lửa',
      fullName: 'Tường Lửa',
      icon: '🛡️',
      canUse: canUseFirewall,
      used: isUsed('FIREWALL'),
      isActive: roundActiveCard === 'FIREWALL',
      bgGradient: 'linear-gradient(135deg, #93C5FD 0%, #2563EB 100%)',
      textColor: '#1E3A8A',
      desc: 'Chặn Rebound đối phương nếu sai'
    }
  ];

  const handleCardClick = (card) => {
    if (card.used || !card.canUse) return;
    triggerHaptic([40, 30]);
    onUseCard(card.id);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: isMobile ? 4 : 8,
        width: '100%',
        padding: isMobile ? '3px 4px' : '5px 8px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
        borderRadius: 12,
        border: '2px solid var(--comic-black)',
        boxShadow: '0 2px 0 var(--comic-black)',
        marginBottom: isMobile ? 4 : 8,
        boxSizing: 'border-box'
      }}
    >
      <div style={{
        fontSize: isMobile ? '0.65rem' : '0.75rem',
        fontWeight: 900,
        color: 'var(--comic-black)',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        paddingLeft: 2
      }}>
        <span>🃏</span>
        {!isMobile && <span>THẺ:</span>}
      </div>

      <div style={{ display: 'flex', gap: isMobile ? 3 : 6, flex: 1, justifyContent: 'flex-end' }}>
        {CARDS.map(card => {
          const clickable = card.canUse && !card.used;
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              disabled={!clickable}
              title={card.used ? `${card.fullName}: Đã dùng` : `${card.fullName}: ${card.desc}`}
              style={{
                flex: 1,
                maxWidth: isMobile ? 76 : 110,
                height: isMobile ? 32 : 36,
                padding: isMobile ? '2px 3px' : '4px 8px',
                borderRadius: 8,
                border: '2px solid var(--comic-black)',
                boxShadow: card.isActive
                  ? '0 0 0 2px #EF4444, 0 2px 0 var(--comic-black)'
                  : (clickable ? '0 2px 0 var(--comic-black)' : 'none'),
                background: card.used
                  ? '#CBD5E1'
                  : (card.isActive ? '#FDE047' : (clickable ? card.bgGradient : '#F1F5F9')),
                color: card.used ? '#94A3B8' : (clickable ? card.textColor : '#94A3B8'),
                fontWeight: 900,
                fontSize: isMobile ? '0.68rem' : '0.78rem',
                cursor: clickable ? 'pointer' : 'not-allowed',
                opacity: card.used ? 0.45 : (clickable || card.isActive ? 1 : 0.6),
                textDecoration: card.used ? 'line-through' : 'none',
                transform: clickable ? 'none' : 'translateY(1px)',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {card.isActive && <span style={{ animation: 'bounce 0.5s infinite' }}>⚡</span>}
              <span>{card.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
