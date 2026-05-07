import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import os from 'os';
import fs from 'fs';

const PHASE_LABELS = {
  address: 'Address / Setup',
  takeaway: 'Takeaway',
  halfwayBack: 'Halfway Back',
  topOfBackswing: 'Top of Backswing',
  transition: 'Transition',
  preImpact: 'Pre-Impact',
  impact: 'Impact',
  followThrough: 'Follow Through',
};

export async function extractFramesAtTimestamps(videoPath, timestamps, angle = 'face-on') {
  const tmpDir = os.tmpdir();
  const frames = [];
  const angleLabel = angle === 'dtl' ? 'DTL' : 'Face-on';

  // Sort timestamps chronologically
  const sortedEntries = Object.entries(timestamps)
    .filter(([, sec]) => sec !== null && sec !== undefined)
    .sort(([, a], [, b]) => a - b);

  console.log(`  Extracting ${sortedEntries.length} frames for ${angleLabel}...`);

  for (const [phase, seconds] of sortedEntries) {
    const outputPath = path.join(tmpDir, `frame_${angle}_${phase}_${Date.now()}.jpg`);

    // Seek to EXACT timestamp — no offset subtraction
    // Use select filter to grab the closest frame to exact second
    await new Promise((resolve) => {
      ffmpeg(videoPath)
        .inputOptions([`-ss ${seconds}`])
        .outputOptions([
          '-frames:v 1',
          '-vf scale=1280:-1',
          '-q:v 2',
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', (err) => {
          console.warn(`  ⚠️ Frame extraction warning for ${phase} at ${seconds}s: ${err.message}`);
          resolve();
        })
        .run();
    });

    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      if (stats.size > 1000) { // Valid frame must be > 1KB
        const data = fs.readFileSync(outputPath);
        const base64 = data.toString('base64');
        const baseLabel = PHASE_LABELS[phase] || phase;
        frames.push({
          phase,
          label: baseLabel,
          angleLabel,
          displayLabel: `${angleLabel}: ${baseLabel}`,
          timestamp: seconds,
          data: base64,
          mediaType: 'image/jpeg',
          angle,
        });
        console.log(`  ✓ ${angleLabel} ${baseLabel} @ ${seconds}s (${(stats.size/1024).toFixed(0)}KB)`);
      } else {
        console.warn(`  ⚠️ Frame too small for ${phase} @ ${seconds}s — skipping`);
      }
      fs.unlinkSync(outputPath);
    } else {
      console.warn(`  ⚠️ No output file for ${phase} @ ${seconds}s`);
    }
  }

  // Sort by timestamp to ensure correct order
  frames.sort((a, b) => a.timestamp - b.timestamp);
  console.log(`  ✅ ${angleLabel} extraction complete: ${frames.length} frames`);
  return frames;
}
