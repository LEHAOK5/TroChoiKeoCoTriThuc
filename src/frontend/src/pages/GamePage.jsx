import React, { useState, useEffect } from 'react';
import TugOfWarArena from '../components/TugOfWarArena';
import QuestionBox from '../components/QuestionBox';
import BuzzerControl from '../components/BuzzerControl';
import FeedbackOverlay from '../components/FeedbackOverlay';
import CountdownOverlay from '../components/CountdownOverlay';
import VictoryModal from '../components/VictoryModal';
import VictoryCutscene from '../components/VictoryCutscene';

export default function GamePage({
  scoreA,
  scoreB,
  ropeOffset,
  currentQuestion,
  deadline,
  uiState,
  buzzerData,
  reboundData,
  lastResult,
  countdown,
  gameOverData,
  roomState,
  player,
  tacticalCards = {},
  roundActiveCard = null,
  activeCardEffects = {},
  isFrozen = false,
  frozenSecondsLeft = 0,
  fiftyFiftyEliminated = [],
  onPressBuzzer,
  onSubmitAnswer,
  onUseCard,
  onRematch
}) {
  const [showCutscene, setShowCutscene] = useState(true);

  useEffect(() => {
    if (gameOverData) {
      setShowCutscene(true);
    }
    const handleHash = () => {
      if (window.location.hash.includes('cutscene')) {
        setShowCutscene(true);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [gameOverData]);

  const teamACount = roomState?.teamA?.length || 2;
  const teamBCount = roomState?.teamB?.length || 2;

  return (
    <main className="game-layout">
      {/* Tier 1: Tug of War Arena (35%) */}
      <TugOfWarArena
        scoreA={scoreA}
        scoreB={scoreB}
        ropeOffset={ropeOffset}
        winner={gameOverData?.winner}
        teamACount={teamACount}
        teamBCount={teamBCount}
        lastResult={lastResult}
        isBuzzed={uiState === 'BUZZER_SELF' || uiState === 'BUZZER_OPPONENT'}
        activeCardEffects={activeCardEffects}
      />

      {/* Tier 2: Quiz Question (25%) */}
      <QuestionBox
        question={currentQuestion}
        deadline={deadline}
      />

      {/* Tier 3: Interactive Thumb Zone (40%) */}
      <BuzzerControl
        uiState={uiState}
        options={currentQuestion?.options || []}
        deadline={deadline}
        buzzerData={buzzerData}
        reboundData={reboundData}
        lastResult={lastResult}
        tacticalCards={tacticalCards}
        roundActiveCard={roundActiveCard}
        playerTeam={player?.team || 'A'}
        isFrozen={isFrozen}
        frozenSecondsLeft={frozenSecondsLeft}
        fiftyFiftyEliminated={fiftyFiftyEliminated}
        onPressBuzzer={onPressBuzzer}
        onSubmitAnswer={onSubmitAnswer}
        onUseCard={onUseCard}
      />

      {/* Result feedback overlay */}
      <FeedbackOverlay result={lastResult} />


      {/* Step 4: Victory Cutscene "Kéo ngã đối thủ" (6-sec animation first) */}
      {gameOverData && showCutscene && (
        <VictoryCutscene
          winner={gameOverData.winner}
          onDone={() => setShowCutscene(false)}
        />
      )}

      {/* Victory Celebration Modal (shows after cutscene is finished or skipped) */}
      {gameOverData && !showCutscene && (
        <VictoryModal
          gameOverData={gameOverData}
          onRematch={onRematch}
          player={player}
        />
      )}
    </main>
  );
}
