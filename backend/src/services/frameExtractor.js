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

export async function extractFramesAtTimestamps(videoPath, timestamps) {
  const tmpDir = os.tmpdir();
  const frames = [];

  for (const [phase, seconds] of Object.entries(timestamps)) {
    if (seconds === null || seconds === undefined) continue;

    const outputPath = path.join(tmpDir, `frame_${phase}_${Date.now()}.jpg`);

    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(Math.max(0, seconds - 0.1))
        .frames(1)
        .size('1280x?')
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    if (fs.existsSync(outputPath)) {
      const data = fs.readFileSync(outputPath);
      const base64 = data.toString('base64');
      frames.push({
        phase,
        label: PHASE_LABELS[phase] || phase,
        timestamp: seconds,
        data: base64,
        mediaType: 'image/jpeg',
      });
      fs.unlinkSync(outputPath);
    }
  }

  // Sort frames by timestamp
  frames.sort((a, b) => a.timestamp - b.timestamp);
  return frames;
}
