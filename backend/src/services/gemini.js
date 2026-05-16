import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const VIDEO_ANALYSIS_PROMPT = `You are an expert golf swing analyst. Watch this entire golf swing video carefully.

Your job is to provide two things:

1. SWING WINDOW: Identify when the actual swing starts and ends (ignore pre-swing setup time and post-swing follow-through walking away).

2. VIDEO OBSERVATIONS: Describe what you actually see happening in the swing as a whole. Focus on motion, tempo, and patterns you can only see by watching the full video — things you couldn't determine from a single frame.

Be specific about:
- Overall tempo and rhythm (rushed? smooth? jerky?)
- Takeaway pattern (inside? outside? one-piece?)
- Any lateral sway or head movement during backswing
- Hip/shoulder sequence on downswing (do hips clear first?)
- Club path through impact (inside-out? over the top?)
- Weight transfer pattern
- Any early extension or standing up through impact
- Follow-through completeness and balance

Return ONLY this JSON (no markdown):
{
  "swingStart": <seconds when golfer begins backswing>,
  "swingEnd": <seconds when follow-through is complete>,
  "swingDuration": <total seconds of actual swing>,
  "videoObservations": {
    "tempo": "<description of overall tempo and rhythm>",
    "takeaway": "<what you observed about the takeaway>",
    "backswing": "<what you observed in the backswing>",
    "transition": "<what you observed at the top and transition>",
    "downswing": "<what you observed on the downswing>",
    "impact": "<what you observed at and through impact>",
    "followThrough": "<what you observed in the follow-through>",
    "keyFaults": ["<fault 1>", "<fault 2>", "<fault 3>"],
    "keyStrengths": ["<strength 1>", "<strength 2>"]
  }
}`;

export async function analyzeVideoAndGetWindow(tmpFile, mimeType) {
  let uploadedFile = null;
  try {
    uploadedFile = await genai.files.upload({
      file: tmpFile,
      config: { mimeType, displayName: `analysis_${Date.now()}` },
    });

    let file = uploadedFile;
    let attempts = 0;
    while (file.state === 'PROCESSING' && attempts < 20) {
      await new Promise(r => setTimeout(r, 2000));
      file = await genai.files.get({ name: file.name });
      attempts++;
    }

    if (file.state !== 'ACTIVE') throw new Error(`Video processing failed: ${file.state}`);

    const isRateLimit = (err) => {
      const msg = JSON.stringify(err?.message || err?.toString() || '');
      return msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
    };

    let response;
    let retries = 0;
    while (retries < 3) {
      try {
        response = await genai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{
            role: 'user',
            parts: [
              { fileData: { mimeType: file.mimeType, fileUri: file.uri }, videoMetadata: { fps: 8 } },
              { text: VIDEO_ANALYSIS_PROMPT }
            ]
          }],
          config: {
            systemInstruction: 'Return only valid JSON. Watch the full video carefully before responding.',
            temperature: 0.2
          },
        });
        break;
      } catch (err) {
        retries++;
        if (isRateLimit(err) && retries < 3) {
          await new Promise(r => setTimeout(r, retries * 10000));
        } else throw err;
      }
    }

    const text = response.text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(text);

    console.log(`🎯 Swing window: ${result.swingStart?.toFixed(2)}s → ${result.swingEnd?.toFixed(2)}s (${result.swingDuration?.toFixed(2)}s)`);
    console.log(`👁️  Key faults: ${result.videoObservations?.keyFaults?.join(', ')}`);
    console.log(`💪 Key strengths: ${result.videoObservations?.keyStrengths?.join(', ')}`);

    return result;

  } finally {
    if (uploadedFile?.name) {
      try { await genai.files.delete({ name: uploadedFile.name }); } catch {}
    }
  }
}
