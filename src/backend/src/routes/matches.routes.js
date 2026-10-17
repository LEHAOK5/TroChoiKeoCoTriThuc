const express = require('express');
const { getMatchByCode, getLeaderboard, getRecentMatches } = require('../repositories/match.repository');

const router = express.Router();

router.get('/leaderboard', async (req, res, next) => {
  try {
    const list = await getLeaderboard();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.get('/:code', async (req, res, next) => {
  try {
    const match = await getMatchByCode(req.params.code);
    if (!match) {
      return res.status(404).json({
        error: { code: 'MATCH_NOT_FOUND', message: 'Không tìm thấy thông tin trận đấu' }
      });
    }
    res.json({ success: true, match });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
