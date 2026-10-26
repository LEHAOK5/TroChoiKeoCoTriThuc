/**
 * RopeCalculator - Tính toán vị trí dây và điều kiện thắng
 * ropeOffset: từ -10 (Đội A thắng tuyệt đối) đến +10 (Đội B thắng tuyệt đối)
 */
class RopeCalculator {
  constructor(winScore = 10) {
    this.winScore = winScore;
  }

  applyScore(team, currentScoreA, currentScoreB, currentRopeOffset, isDoublePull = false) {
    let scoreA = currentScoreA;
    let scoreB = currentScoreB;
    let ropeOffset = currentRopeOffset;
    const step = isDoublePull ? 2 : 1;

    if (team === 'A') {
      scoreA += step;
      ropeOffset = Math.max(-10, ropeOffset - step);
    } else if (team === 'B') {
      scoreB += step;
      ropeOffset = Math.min(10, ropeOffset + step);
    }

    const isWinnerA = scoreA >= this.winScore || ropeOffset <= -10;
    const isWinnerB = scoreB >= this.winScore || ropeOffset >= 10;

    let winner = null;
    if (isWinnerA) winner = 'A';
    else if (isWinnerB) winner = 'B';

    return {
      scoreA,
      scoreB,
      ropeOffset,
      winner
    };
  }

  applyPenalty(penalizedTeam, currentScoreA, currentScoreB, currentRopeOffset, penaltySteps = 1) {
    let scoreA = currentScoreA;
    let scoreB = currentScoreB;
    let ropeOffset = currentRopeOffset;

    // Lùi dây về phía đối phương
    if (penalizedTeam === 'A') {
      ropeOffset = Math.min(10, ropeOffset + penaltySteps);
    } else if (penalizedTeam === 'B') {
      ropeOffset = Math.max(-10, ropeOffset - penaltySteps);
    }

    const isWinnerA = scoreA >= this.winScore || ropeOffset <= -10;
    const isWinnerB = scoreB >= this.winScore || ropeOffset >= 10;

    let winner = null;
    if (isWinnerA) winner = 'A';
    else if (isWinnerB) winner = 'B';

    return {
      scoreA,
      scoreB,
      ropeOffset,
      winner
    };
  }
}

module.exports = RopeCalculator;
