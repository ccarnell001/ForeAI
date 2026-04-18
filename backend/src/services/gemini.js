import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import os from 'os';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are ForeAI, an elite golf swing coach and biomechanics expert with 20+ years experience coaching players from beginners to tour professionals. You are analyzing a golf swing video.

Watch the ENTIRE video carefully. Pay attention to:
- SETUP & ADDRESS: posture, spine angle, ball position, grip, stance width, weight distribution
- BACKSWING: takeaway path, shoulder turn, hip rotation, wrist hinge, club plane, weight shift
- TOP OF BACKSWING: club position, wrist conditions, shoulder vs hip turn ratio, head position
- DOWNSWING: transition sequence (hips lead), lag retention, club path, weight transfer
- IMPACT: hand position relative to ball, hip clearance, spine angle, club face angle
- FOLLOW THROUGH: extension, rotation, balance, finish position

Return your analysis as a JSON object with this EXACT structure and nothing else:
{
  "overallScore": <number 1-100>,
  "summary": "<2-3 sentence overall impression>",
  "viewType": "<face-on|down-the-line|both angles|unknown>",
  "phases": [
    {
      "name": "<phase name>",
      "score": <number 1-100>,
      "observations": ["<specific observation>"],
      "positives": ["<what they are doing well>"],
      "improvements": ["<specific fix needed>"]
    }
  ],
  "topPriorities": [
    {
      "title": "<short fix title>",
      "description": "<detailed explanation of the issue and why it matters>",
      "drill": "<specific drill name>",
      "drillDescription": "<how to do the drill>",
      "youtubeSearch": "<exact youtube search query>"
    }
  ],
  "prosToStudy": [
    {
      "name": "<pro golfer name>",
      "reason": "<why their swing is relevant>"
    }
  ],
  "encouragement": "<personalized motivational closing message>"
}

Be specific, encouraging, and technically precise. Focus on the 2-3 highest-impact changes.`;

export async function analyzeSwingVideo(videoBuffer, mimeType, metadata) {
  const { club, viewType, notes, userName } = metadata;

  // Write buffer to temp file
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `swing_${Date.now()}.${mimeType === 'video/quicktime' ? 'mov' : 'mp4'}`);
  fs.writeFileSync(tmpFile, videoBuffer);

  let uploadedFile = null;
  try {
    // Upload video to Gemini Files API
    uploadedFile = await genai.files.upload({
      file: tmpFile,
      config: { mimeType, displayName: `${userName}_swing_${Date.now()}` },
    });

    // Wait for file to be processed
    let file = uploadedFile;
    let attempts = 0;
    while (file.state === 'PROCESSING' && attempts < 30) {
      await new Promise(r => setTimeout(r, 2000));
      file = await genai.files.get({ name: file.name });
      attempts++;
    }

    if (file.state !== 'ACTIVE') {
      throw new Error(`Video processing failed with state: ${file.state}`);
    }

    const prompt = `Please analyze ${userName}'s golf swing video.

${club ? `Club being used: ${club}` : ''}
${viewType && viewType !== 'unknown' ? `Camera angle: ${viewType}` : ''}
${notes ? `Student notes: ${notes}` : ''}

Watch the full swing from start to finish. Provide thorough, encouraging analysis with specific actionable feedback. Return ONLY valid JSON matching the specified structure — no markdown, no backticks, no preamble.`;

    // Retry with exponential backoff for rate limit errors
    let response;
    let retryAttempts = 0;
    const isRateLimit = (err) => {
      const msg = JSON.stringify(err?.message || err?.toString() || '');
      return msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Too Many Requests');
    };
    while (retryAttempts < 4) {
      try {
        response = await genai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            { role: 'user', parts: [{ fileData: { mimeType: file.mimeType, fileUri: file.uri } }, { text: prompt }] }
          ],
          config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.3 },
        });
        break;
      } catch (err) {
        retryAttempts++;
        if (isRateLimit(err) && retryAttempts < 4) {
          const wait = retryAttempts * 15000;
          console.log(`Rate limited, retrying in ${wait/1000}s (attempt ${retryAttempts}/3)...`);
          await new Promise(r => setTimeout(r, wait));
        } else if (isRateLimit(err)) {
          throw new Error('ForeAI is experiencing high demand right now. Please wait 60 seconds and try again.');
        } else {
          throw err;
        }
      }
    }

    const text = response.text;
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);

  } finally {
    // Clean up temp file
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    // Delete from Gemini Files API to save quota
    if (uploadedFile?.name) {
      try { await genai.files.delete({ name: uploadedFile.name }); } catch {}
    }
  }
}
