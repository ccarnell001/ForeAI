import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { requireAuth } from '../middleware/auth.js';
import { checkQuota, incrementQuota } from '../middleware/quota.js';
import { getSwingTimestamps } from '../services/gemini.js';
import { extractFramesAtTimestamps } from '../services/frameExtractor.js';
import { analyzeSwingFrames } from '../services/claude.js';
import { pool } from '../db/index.js';

const router = express.Router();

router.post('/', requireAuth, checkQuota, async (req, res) => {
  const { videoData, mimeType, club, viewType, notes, title } = req.body;
  if (!videoData) return res.status(400).json({ error: 'No video data provided' });

  const userId = req.user.id;
  const userName = req.user.name;
  const tmpFile = path.join(os.tmpdir(), `swing_${userId}_${Date.now()}.${mimeType === 'video/quicktime' ? 'mov' : 'mp4'}`);

  // Use SSE headers so frontend can get phase updates
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');

  const sendStatus = (phase, message) => {
    res.write(`data: ${JSON.stringify({ type: 'status', phase, message })}\n\n`);
  };
  const sendResult = (data) => {
    res.write(`data: ${JSON.stringify({ type: 'result', ...data })}\n\n`);
    res.end();
  };
  const sendError = (error) => {
    res.write(`data: ${JSON.stringify({ type: 'error', error })}\n\n`);
    res.end();
  };

  try {
    // Write video to temp file
    const videoBuffer = Buffer.from(videoData, 'base64');
    fs.writeFileSync(tmpFile, videoBuffer);
    console.log(`🎬 Video saved: ${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB`);

    sendStatus('uploading', 'Video received — starting analysis...');

    // Phase 1: Gemini finds the 8 key timestamps
    console.log('⏱️  Phase 1: Gemini identifying key swing positions...');
    sendStatus('gemini', 'Gemini is finding key swing positions...');
    const timestamps = await getSwingTimestamps(tmpFile, mimeType || 'video/mp4');
    console.log('✅ Timestamps:', JSON.stringify(timestamps));

    // Phase 2: Extract exact frames at those timestamps
    console.log('🖼️  Phase 2: Extracting frames at key positions...');
    sendStatus('extracting', 'Extracting frames at key positions...');
    const frames = await extractFramesAtTimestamps(tmpFile, timestamps);
    console.log(`✅ Extracted ${frames.length} frames`);

    if (frames.length === 0) {
      throw new Error('Could not extract frames from video. Please try a different format.');
    }

    // Get user handicap for Claude context
    const userResult = await pool.query('SELECT handicap FROM users WHERE id = $1', [userId]);
    const handicap = userResult.rows[0]?.handicap;

    // Phase 3: Claude deep-analyzes all frames
    console.log('🧠 Phase 3: Claude analyzing swing positions...');
    sendStatus('claude', 'Claude is analyzing each swing position...');
    const report = await analyzeSwingFrames(frames, {
      club, viewType, notes, userName, handicap
    });
    console.log(`✅ Analysis complete — score: ${report.overallScore}`);

    // Save to database
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
    sendResult({
      report,
      sessionId,
      quota: { used: usedNow, limit: req.quotaLimit, remaining: req.quotaLimit - usedNow },
    });

  } catch (err) {
    console.error('Analysis error:', err);
    sendError(err.message || 'Analysis failed. Please try again.');
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
});

export default router;
