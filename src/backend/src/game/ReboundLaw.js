class ReboundLaw {
  constructor(timeoutSec = 8) {
    this.timeoutSec = timeoutSec;
  }

  createReboundOpportunity({ failedTeam, eliminatedIndex }) {
    const reboundTeam = failedTeam === 'A' ? 'B' : 'A';
    const deadline = Date.now() + this.timeoutSec * 1000;

    return {
      failedTeam,
      reboundTeam,
      eliminatedIndex,
      timeLimit: this.timeoutSec,
      deadline
    };
  }
}

module.exports = ReboundLaw;
