/**
 * RopeCalculator - Tính toán vị trí dây và điều kiện thắng
 * ropeOffset: từ -10 (Đội A thắng tuyệt đối) đến +10 (Đội B thắng tuyệt đối)
 */
class RopeCalculator {
  constructor(winScore = 10) {
    this.winScore = winScore;
  }

  applyScore(team, currentScoreA, currentScoreB, currentRopeOffset) {
    let scoreA = currentScoreA;
    let scoreB = currentScoreB;
    let ropeOffset = currentRopeOffset;

    if (team === 'A') {
      scoreA += 1;
      ropeOffset = Math.max(-10, ropeOffset - 1);
    } else if (team === 'B') {
      scoreB += 1;
      ropeOffset = Math.min(10, ropeOffset + 1);
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
