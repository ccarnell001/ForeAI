import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import os from 'os';
import fs from 'fs';

// 8 position labels in chronological order
const POSITION_LABELS = [
  'Address / Setup',
  'Takeaway',
  'Halfway Back',
  'Top of Backswing',
  'Transition',
  'Pre-Impact',
  'Impact',
  'Follow Through',
];

function getVideoDuration(videoPath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) { resolve(null); return; }
      resolve(metadata?.format?.duration || null);
    });
  });
}

export async function extractEvenFrames(videoPath, swingStart, swingEnd, angle = 'face-on', frameCount = 8) {
  const tmpDir = os.tmpdir();
  const frames = [];
  const angleLabel = angle === 'dtl' ? 'DTL' : 'Face-on';

  // Get actual video duration
  const duration = await getVideoDuration(videoPath);
  console.log(`  📹 ${angleLabel} video duration: ${duration?.toFixed(2)}s`);

  // Cap swing window to actual video duration
  const videoEnd = duration ? duration - 0.1 : swingEnd;
  const effectiveStart = Math.max(0, swingStart);
  const effectiveEnd = Math.min(videoEnd, swingEnd);
  const swingSpan = effectiveEnd - effectiveStart;

  console.log(`  🎯 Extracting ${frameCount} frames from ${effectiveStart.toFixed(2)}s → ${effectiveEnd.toFixed(2)}s`);

  // Space frames evenly across the swing window
  for (let i = 0; i < frameCount; i++) {
    const ratio = frameCount === 1 ? 0.5 : i / (frameCount - 1);
    const seekTime = effectiveStart + ratio * swingSpan;
    const label = POSITION_LABELS[i] || `Frame ${i + 1}`;
    const outputPath = path.join(tmpDir, `frame_${angle}_${i}_${Date.now()}.jpg`);

    await new Promise((resolve) => {
      ffmpeg(videoPath)
        .inputOptions([`-ss ${seekTime.toFixed(3)}`])
        .outputOptions(['-frames:v 1', '-vf scale=1280:-1', '-q:v 2'])
        .output(outputPath)
        .on('end', resolve)
        .on('error', (err) => {
          console.warn(`  ⚠️ Frame ${i+1} warning at ${seekTime.toFixed(2)}s: ${err.message}`);
          resolve();
        })
        .run();
    });

    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      if (stats.size > 1000) {
        const data = fs.readFileSync(outputPath);
        frames.push({
          index: i,
          label,
          angleLabel,
          displayLabel: `${angleLabel}: ${label}`,
          timestamp: seekTime,
          data: data.toString('base64'),
          mediaType: 'image/jpeg',
          angle,
        });
        console.log(`  ✓ ${angleLabel} Frame ${i+1} "${label}" @ ${seekTime.toFixed(2)}s (${(stats.size/1024).toFixed(0)}KB)`);
      } else {
        console.warn(`  ⚠️ Frame ${i+1} too small at ${seekTime.toFixed(2)}s`);
      }
      fs.unlinkSync(outputPath);
    }
  }

  console.log(`  ✅ ${angleLabel} extraction complete: ${frames.length}/${frameCount} frames`);
  return frames;
}
