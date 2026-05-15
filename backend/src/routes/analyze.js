import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { requireAuth } from '../middleware/auth.js';
import { checkQuota, incrementQuota } from '../middleware/quota.js';
import { getSwingTimestamps } from '../services/gemini.js';
import { extractFramesAtTimestamps } from '../services/frameExtractor.js';
import { analyzeSwingFrames } from '../services/claude.js';
import { uploadSessionFrames } from '../services/r2.js';
import { pool } from '../db/index.js';

const router = express.Router();

function attachFramesByIndex(phases, primaryFrames, secondaryFrames) {
  return phases.map((phase, i) => {
    const primaryFrame = primaryFrames[i] || null;
    const secondaryFrame = secondaryFrames[i] || null;
    console.log(`  Phase ${i+1} "${phase.name}" → primary[${i}]="${primaryFrame?.label || 'none'}" secondary[${i}]="${secondaryFrame?.label || 'none'}"`);
    return {
      ...phase,
      frameImage: primaryFrame?.data || null,
      frameImage2: secondaryFrame?.data || null,
    };
  });
}

router.post('/', requireAuth, checkQuota, async (req, res) => {
  const { videoData, videoData2, mimeType, mimeType2, club, viewType, notes, title } = req.body;
  if (!videoData) return res.status(400).json({ error: 'No video data provided' });

  const userId = req.user.id;
  const userName = req.user.name;
  const ext1 = mimeType === 'video/quicktime' ? 'mov' : 'mp4';
  const ext2 = mimeType2 === 'video/quicktime' ? 'mov' : 'mp4';
  const tmpFile1 = path.join(os.tmpdir(), `swing_${userId}_${Date.now()}_1.${ext1}`);
  const tmpFile2 = videoData2 ? path.join(os.tmpdir(), `swing_${userId}_${Date.now()}_2.${ext2}`) : null;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');

  const sendStatus = (phase, message) => res.write(`data: ${JSON.stringify({ type: 'status', phase, message })}\n\n`);
  const sendResult = (data) => { res.write(`data: ${JSON.stringify({ type: 'result', ...data })}\n\n`); res.end(); };
  const sendError = (error) => { res.write(`data: ${JSON.stringify({ type: 'error', error })}\n\n`); res.end(); };

  try {
    const videoBuffer1 = Buffer.from(videoData, 'base64');
    fs.writeFileSync(tmpFile1, videoBuffer1);
    console.log(`🎬 Primary video: ${(videoBuffer1.length/1024/1024).toFixed(1)}MB`);

    if (videoData2 && tmpFile2) {
      const videoBuffer2 = Buffer.from(videoData2, 'base64');
      fs.writeFileSync(tmpFile2, videoBuffer2);
      console.log(`🎬 Secondary video: ${(videoBuffer2.length/1024/1024).toFixed(1)}MB`);
    }

    sendStatus('uploading', 'Video received — starting analysis...');

    console.log('⏱️  Phase 1: Gemini identifying key swing positions...');
    sendStatus('gemini', 'Gemini is finding key swing positions...');
    const timestamps = await getSwingTimestamps(tmpFile1, mimeType || 'video/mp4');
    console.log('✅ Timestamps:', JSON.stringify(timestamps));

    console.log('🖼️  Phase 2: Extracting frames...');
    sendStatus('extracting', videoData2 ? 'Extracting frames from both videos...' : 'Extracting frames at key positions...');
    const primaryFrames = await extractFramesAtTimestamps(tmpFile1, timestamps, 'face-on');
    console.log(`✅ Primary frames extracted: ${primaryFrames.length}`);

    let secondaryFrames = [];
    if (tmpFile2) {
      secondaryFrames = await extractFramesAtTimestamps(tmpFile2, timestamps, 'dtl');
      console.log(`✅ Secondary frames extracted: ${secondaryFrames.length}`);
    }

    const allFrames = [...primaryFrames, ...secondaryFrames];
    console.log(`✅ Total frames: ${allFrames.length}`);
    if (primaryFrames.length === 0) throw new Error('Could not extract frames from video. Please try a different format.');

    const userResult = await pool.query('SELECT handicap FROM users WHERE id = $1', [userId]);
    const handicap = userResult.rows[0]?.handicap;
    const hasBothAngles = secondaryFrames.length > 0;

    console.log('🧠 Phase 3: Claude analyzing swing positions...');
    sendStatus('claude', 'Claude is analyzing each swing position...');
    const report = await analyzeSwingFrames(allFrames, {
      club, viewType: hasBothAngles ? 'both angles' : (viewType || 'face-on'),
      notes, userName, handicap, hasBothAngles,
    });
    console.log(`✅ Analysis complete — score: ${report.overallScore}`);

    // Attach frames by index
    console.log('🗺️  Attaching frames by index order...');
    const reportWithFrames = {
      ...report,
      hasBothAngles,
      phases: attachFramesByIndex(report.phases || [], primaryFrames, secondaryFrames),
    };

    // Save session to database
    const sessionResult = await pool.query(
      `INSERT INTO sessions (user_id, title, club, view_type, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, title || `${club || 'Swing'} analysis`, club || null,
       hasBothAngles ? 'both angles' : (viewType || null), notes || null]
    );
    const sessionId = sessionResult.rows[0].id;

    // Upload frames to R2 in background (don't block response)
    sendStatus('saving', 'Saving your swing frames...');
    let frameUrls = {};
    try {
      frameUrls = await uploadSessionFrames(sessionId, userId, reportWithFrames.phases);
      console.log(`☁️  Uploaded ${Object.keys(frameUrls).length} frame sets to R2`);
    } catch (err) {
      console.error('⚠️ R2 upload failed (non-fatal):', err.message);
    }

    // Save analysis with frame URLs
    await pool.query(
      `INSERT INTO analyses (session_id, user_id, frame_count, report, frame_urls)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, userId, allFrames.length, JSON.stringify(report), JSON.stringify(frameUrls)]
    );

    await incrementQuota(userId);

    const usedNow = req.quotaUsed + 1;
    sendResult({
      report: reportWithFrames,
      sessionId,
      quota: { used: usedNow, limit: req.quotaLimit, remaining: req.quotaLimit - usedNow },
    });

  } catch (err) {
    console.error('Analysis error:', err);
    sendError(err.message || 'Analysis failed. Please try again.');
  } finally {
    if (fs.existsSync(tmpFile1)) fs.unlinkSync(tmpFile1);
    if (tmpFile2 && fs.existsSync(tmpFile2)) fs.unlinkSync(tmpFile2);
  }
});

export default router;
