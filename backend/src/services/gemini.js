import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import os from 'os';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TIMESTAMP_PROMPT = `You are analyzing a golf swing video. Your ONLY job is to identify the exact timestamps (in seconds) of 8 key positions.

CRITICAL RULES:
- Each timestamp MUST be different — no two positions can share the same timestamp
- Timestamps must be in ASCENDING ORDER (address < takeaway < halfwayBack < topOfBackswing < transition < preImpact < impact < followThrough)
- Spread them across the FULL duration of the swing — do not cluster them together
- Minimum gap between consecutive timestamps: 0.1 seconds
- If you cannot identify a position precisely, interpolate between surrounding positions

Return ONLY this JSON object (no markdown, no explanation):
{
  "address": <seconds - earliest timestamp>,
  "takeaway": <seconds>,
  "halfwayBack": <seconds>,
  "topOfBackswing": <seconds>,
  "transition": <seconds>,
  "preImpact": <seconds>,
  "impact": <seconds>,
  "followThrough": <seconds - latest timestamp>
}

Definitions:
- address: golfer still at ball, ready to swing (start of sequence)
- takeaway: club moving back, shaft roughly parallel to ground  
- halfwayBack: lead arm parallel to ground
- topOfBackswing: club at highest point, maximum shoulder turn
- transition: backswing ends, downswing begins
- preImpact: hands at hip height on downswing
- impact: club at or near ball
- followThrough: club past ball, arms extending (end of sequence)`;

export async function getSwingTimestamps(tmpFile, mimeType) {
  let uploadedFile = null;
  try {
    uploadedFile = await genai.files.upload({
      file: tmpFile,
      config: { mimeType, displayName: `timestamps_${Date.now()}` },
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
              { fileData: { mimeType: file.mimeType, fileUri: file.uri }, videoMetadata: { fps: 6 } },
              { text: TIMESTAMP_PROMPT }
            ]
          }],
          config: {
            systemInstruction: 'Return only valid JSON. No markdown. No explanation. Ensure all 8 timestamps are unique and in ascending order.',
            temperature: 0.1
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
    const timestamps = JSON.parse(text);

    // Validate and fix timestamps — ensure they are unique and ascending
    const phases = ['address','takeaway','halfwayBack','topOfBackswing','transition','preImpact','impact','followThrough'];
    let lastTime = -1;
    for (const phase of phases) {
      if (timestamps[phase] <= lastTime) {
        timestamps[phase] = lastTime + 0.15; // Force minimum gap
        console.warn(`  ⚠️ Fixed timestamp for ${phase}: set to ${timestamps[phase]}`);
      }
      lastTime = timestamps[phase];
    }

    return timestamps;

  } finally {
    if (uploadedFile?.name) {
      try { await genai.files.delete({ name: uploadedFile.name }); } catch {}
    }
  }
}
