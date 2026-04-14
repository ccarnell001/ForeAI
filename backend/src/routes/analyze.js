import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { checkQuota, incrementQuota } from '../middleware/quota.js';
import { analyzeSwing } from '../services/claude.js';
import { pool } from '../db/index.js';

const router = express.Router();

router.post('/', requireAuth, checkQuota, async (req, res) => {
  const { frames, club, viewType, notes, title } = req.body;

  if (!frames || !Array.isArray(frames) || frames.length === 0)
    return res.status(400).json({ error: 'At least one frame is required' });
  if (frames.length > 12)
    return res.status(400).json({ error: 'Maximum 12 frames per analysis' });

  const userId = req.user.id;
  const userName = req.user.name;

  try {
    const report = await analyzeSwing(frames, { club, viewType, notes, userName });

    const sessionResult = await pool.query(
      `INSERT INTO sessions (user_id, title, club, view_type, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, title || `${club || 'Swing'} analysis`, club || null, viewType || null, notes || null]
    );
    const sessionId = sessionResult.rows[0].id;

    await pool.query(
      `INSERT INTO analyses (session_id, user_id, frame_count, report)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, userId, frames.length, JSON.stringify(report)]
    );

    await incrementQuota(userId);

    const usedNow = req.quotaUsed + 1;
    res.json({
      report,
      sessionId,
      quota: { used: usedNow, limit: req.quotaLimit, remaining: req.quotaLimit - usedNow },
    });
  } catch (err) {
    console.error('Analysis error:', err);
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'Failed to parse AI response. Please try again.' });
    }
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

export default router;
