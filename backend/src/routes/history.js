import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { pool } from '../db/index.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.title, s.club, s.view_type, s.notes, s.created_at,
              a.id as analysis_id, a.frame_count,
              a.report->>'overallScore' as score,
              a.report->>'summary' as summary
       FROM sessions s
       LEFT JOIN analyses a ON a.session_id = s.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ sessions: result.rows });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

router.get('/:sessionId', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.title, s.club, s.view_type, s.notes, s.created_at,
              a.id as analysis_id, a.frame_count, a.report, a.created_at as analyzed_at
       FROM sessions s
       LEFT JOIN analyses a ON a.session_id = s.id
       WHERE s.id = $1 AND s.user_id = $2`,
      [req.params.sessionId, req.user.id]
    );
    if (!result.rows[0])
      return res.status(404).json({ error: 'Session not found' });
    res.json({ session: result.rows[0] });
  } catch (err) {
    console.error('Session fetch error:', err);
    res.status(500).json({ error: 'Failed to load session' });
  }
});

router.delete('/:sessionId', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM sessions WHERE id = $1 AND user_id = $2',
      [req.params.sessionId, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

router.get('/quota/today', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT count FROM usage_log WHERE user_id = $1 AND date = CURRENT_DATE',
      [req.user.id]
    );
    const used = result.rows[0]?.count || 0;
    res.json({ used, limit: 3, remaining: 3 - used });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check quota' });
  }
});

export default router;
