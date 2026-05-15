import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { pool } from '../db/index.js';
import { getFrameAsBase64 } from '../services/r2.js';

const router = express.Router();

router.get('/quota/today', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT count FROM usage_log WHERE user_id = $1 AND date = CURRENT_DATE`,
      [req.user.id]
    );
    const used = result.rows[0]?.count || 0;
    const limit = parseInt(process.env.DAILY_LIMIT || '10');
    res.json({ used, limit, remaining: limit - used });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.title, s.club, s.view_type, s.notes, s.created_at,
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
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.title, s.club, s.view_type, s.notes, s.created_at,
              a.report, a.frame_count, a.frame_urls
       FROM sessions s
       LEFT JOIN analyses a ON a.session_id = s.id
       WHERE s.id = $1 AND s.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Session not found' });

    const session = result.rows[0];
    const report = session.report;
    const frameUrls = session.frame_urls || {};

    // Load frame images from R2 for each phase
    if (report?.phases && Object.keys(frameUrls).length > 0) {
      console.log(`📂 Loading frames from R2 for session ${session.id}...`);
      const phasesWithFrames = await Promise.all(
        report.phases.map(async (phase) => {
          const urls = frameUrls[phase.name];
          if (!urls) return phase;

          const [frameImage, frameImage2] = await Promise.all([
            urls.primary ? getFrameAsBase64(urls.primary) : null,
            urls.dtl ? getFrameAsBase64(urls.dtl) : null,
          ]);

          if (frameImage) console.log(`  ✓ Loaded frame for ${phase.name}`);
          return { ...phase, frameImage, frameImage2 };
        })
      );

      report.phases = phasesWithFrames;
      console.log(`✅ Frames loaded for session ${session.id}`);
    }

    res.json({ session: { ...session, report } });
  } catch (err) {
    console.error('History session error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM sessions WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
