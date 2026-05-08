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

// Get video duration using ffprobe
function getVideoDuration(videoPath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.warn(`⚠️ Could not get duration for ${videoPath}: ${err.message}`);
        resolve(null);
      } else {
        const duration = metadata?.format?.duration || null;
        console.log(`  📹 Video duration: ${duration?.toFixed(2)}s`);
        resolve(duration);
      }
    });
  });
}

export async function extractFramesAtTimestamps(videoPath, timestamps, angle = 'face-on') {
  const tmpDir = os.tmpdir();
  const frames = [];
  const angleLabel = angle === 'dtl' ? 'DTL' : 'Face-on';

  // Get video duration to avoid seeking past end
  const duration = await getVideoDuration(videoPath);

  // Sort timestamps chronologically
  const sortedEntries = Object.entries(timestamps)
    .filter(([, sec]) => sec !== null && sec !== undefined)
    .sort(([, a], [, b]) => a - b);

  console.log(`  Extracting ${sortedEntries.length} frames for ${angleLabel}...`);

  for (const [phase, seconds] of sortedEntries) {
    // Skip if timestamp is beyond video duration (with 0.2s buffer)
    if (duration && seconds > duration - 0.1) {
      console.warn(`  ⚠️ Skipping ${phase} @ ${seconds}s — beyond video duration (${duration?.toFixed(2)}s)`);
      continue;
    }

    // For DTL, scale timestamps proportionally if video is shorter
    let seekTime = seconds;
    if (duration && angle === 'dtl') {
      // Get primary video duration from first timestamp to last
      const allTimes = sortedEntries.map(([, s]) => s);
      const primaryStart = allTimes[0];
      const primaryEnd = allTimes[allTimes.length - 1];
      const primarySpan = primaryEnd - primaryStart;

      if (primarySpan > 0 && duration < primaryEnd) {
        // Scale timestamp proportionally to DTL video duration
        const ratio = (seconds - primaryStart) / primarySpan;
        const dtlStart = allTimes[0];
        const dtlEnd = Math.min(duration - 0.2, primaryEnd);
        seekTime = dtlStart + ratio * (dtlEnd - dtlStart);
        seekTime = Math.max(0, Math.min(seekTime, duration - 0.1));
        console.log(`  📐 Scaled ${phase}: ${seconds}s → ${seekTime.toFixed(2)}s for DTL`);
      }
    }

    const outputPath = path.join(tmpDir, `frame_${angle}_${phase}_${Date.now()}.jpg`);

    await new Promise((resolve) => {
      ffmpeg(videoPath)
        .inputOptions([`-ss ${seekTime}`])
        .outputOptions([
          '-frames:v 1',
          '-vf scale=1280:-1',
          '-q:v 2',
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', (err) => {
          console.warn(`  ⚠️ Frame extraction warning for ${phase} at ${seekTime}s: ${err.message}`);
          resolve();
        })
        .run();
    });

    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      if (stats.size > 1000) {
        const data = fs.readFileSync(outputPath);
        const base64 = data.toString('base64');
        const baseLabel = PHASE_LABELS[phase] || phase;
        frames.push({
          phase,
          label: baseLabel,
          angleLabel,
          displayLabel: `${angleLabel}: ${baseLabel}`,
          timestamp: seekTime,
          data: base64,
          mediaType: 'image/jpeg',
          angle,
        });
        console.log(`  ✓ ${angleLabel} ${baseLabel} @ ${seekTime.toFixed(2)}s (${(stats.size/1024).toFixed(0)}KB)`);
      } else {
        console.warn(`  ⚠️ Frame too small for ${phase} @ ${seekTime}s`);
      }
      fs.unlinkSync(outputPath);
    } else {
      console.warn(`  ⚠️ No output file for ${phase} @ ${seekTime}s`);
    }
  }

  frames.sort((a, b) => a.timestamp - b.timestamp);
  console.log(`  ✅ ${angleLabel} extraction complete: ${frames.length} frames`);
  return frames;
}
