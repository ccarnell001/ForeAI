import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import os from 'os';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TIMESTAMP_PROMPT = `You are analyzing a golf swing video. Your ONLY job is to identify the exact timestamps (in seconds) of these 8 key positions in the swing.

Return ONLY a JSON object — no markdown, no explanation:
{
  "address": <seconds>,
  "takeaway": <seconds>,
  "halfwayBack": <seconds>,
  "topOfBackswing": <seconds>,
  "transition": <seconds>,
  "preImpact": <seconds>,
  "impact": <seconds>,
  "followThrough": <seconds>
}

Definitions:
- address: golfer is set up still at the ball, ready to swing
- takeaway: club has moved back, shaft roughly parallel to ground
- halfwayBack: left arm (for right-handed) parallel to ground
- topOfBackswing: club is at highest point, maximum shoulder turn
- transition: split second where backswing ends and downswing begins
- preImpact: hands are at hip height on downswing
- impact: club is at or near the ball
- followThrough: club has passed ball, arms extending toward target

If you cannot identify a position clearly, use your best estimate based on surrounding context. Always return all 8 timestamps.`;

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
          config: { systemInstruction: 'Return only valid JSON. No markdown. No explanation.', temperature: 0.1 },
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
    return JSON.parse(text);

  } finally {
    if (uploadedFile?.name) {
      try { await genai.files.delete({ name: uploadedFile.name }); } catch {}
    }
  }
}
