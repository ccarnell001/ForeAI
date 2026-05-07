import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are ForeAI, an elite golf swing coach and biomechanics expert with 20+ years experience coaching players from beginners to tour professionals.

You are analyzing precisely extracted frames from a golf swing. Each frame is labeled with its angle (Face-on or DTL/Down-the-line) and swing position.

When BOTH angles are provided for a position, cross-reference them:
- Face-on shows: rotation, posture, weight shift, spine angle, shoulder/hip tilt
- DTL shows: club path, swing plane, hand position, extension, club face angle

Analyze each position with precision:
ADDRESS: spine angle, ball position, grip, weight distribution, knee flex
TAKEAWAY: club path, wrist hinge, hip stability
HALFWAY BACK: club shaft angle, wrist hinge, shoulder turn
TOP OF BACKSWING: shoulder/hip turn degrees, wrist position, club position
TRANSITION: sequence order, lag creation, weight shift
PRE-IMPACT: hands ahead of ball, hip clearance, lag retention
IMPACT: shaft lean, face angle, hip position, head behind ball
FOLLOW THROUGH: extension, rotation, balance, finish

ANNOTATION INSTRUCTIONS:
For each phase provide 2-3 annotations as percentage coordinates (0.0-1.0) of frame dimensions.
Types: SPINE_ANGLE, SHOULDER_LINE, HIP_LINE, CLUB_PATH, ARM_LINE, WEIGHT_SHIFT, HEAD_POSITION
Colors: red, yellow, cyan, white, orange

CRITICAL: Return ONLY valid JSON. No markdown. No backticks. No explanation. Start your response with { and end with }.`;

export async function analyzeSwingFrames(frames, metadata) {
  const { club, viewType, notes, userName, handicap, hasBothAngles } = metadata;

  const imageContent = [];
  frames.forEach((frame, i) => {
    imageContent.push({
      type: 'text',
      text: `Frame ${i + 1} — ${frame.displayLabel || frame.label} (${frame.timestamp?.toFixed(2)}s):`,
    });
    imageContent.push({
      type: 'image',
      source: { type: 'base64', media_type: frame.mediaType || 'image/jpeg', data: frame.data },
    });
  });

  const frameList = frames.map((f, i) =>
    `Frame ${i + 1}: ${f.displayLabel || f.label} at ${f.timestamp?.toFixed(2)}s`
  ).join('\n');

  const prompt = `Analyze ${userName}'s golf swing.

Frames provided:
${frameList}

${hasBothAngles ? '✅ Both face-on AND down-the-line angles — cross-reference for maximum accuracy.' : ''}
${club ? `Club: ${club}` : ''}
${handicap ? `Handicap: ${handicap}` : ''}
${notes ? `Notes: "${notes}"` : ''}

Use EXACTLY these phase names: Address / Setup, Takeaway, Halfway Back, Top of Backswing, Transition, Pre-Impact, Impact, Follow Through

Return this exact JSON structure (no markdown, start with {):
{
  "overallScore": <1-100>,
  "summary": "<2-3 sentences>",
  "viewType": "<face-on|down-the-line|both angles>",
  "phases": [
    {
      "name": "<exact phase name from list above>",
      "timestamp": <seconds>,
      "score": <1-100>,
      "observations": ["<observation>"],
      "positives": ["<positive>"],
      "improvements": ["<improvement>"],
      "annotations": [
        {
          "type": "<type>",
          "label": "<short label>",
          "color": "<color>",
          "x1": <0.0-1.0>,
          "y1": <0.0-1.0>,
          "x2": <0.0-1.0>,
          "y2": <0.0-1.0>,
          "note": "<coaching note>"
        }
      ]
    }
  ],
  "topPriorities": [
    {
      "title": "<title>",
      "description": "<description>",
      "drill": "<drill name>",
      "drillDescription": "<how to do it>",
      "youtubeSearch": "<search query>"
    }
  ],
  "prosToStudy": [{"name": "<name>", "reason": "<reason>"}],
  "encouragement": "<message>"
}`;

  let response;
  let retries = 0;
  while (retries < 4) {
    try {
      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 12000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: [...imageContent, { type: 'text', text: prompt }] }],
      });
      break;
    } catch (err) {
      retries++;
      const isOverload = err?.status === 529 || err?.status === 503 ||
        JSON.stringify(err?.message || '').includes('overloaded') ||
        JSON.stringify(err?.message || '').includes('high demand');
      if (isOverload && retries < 4) {
        const wait = retries * 12000;
        console.log(`Claude overloaded, retrying in ${wait/1000}s (attempt ${retries}/3)...`);
        await new Promise(r => setTimeout(r, wait));
      } else throw err;
    }
  }

  const raw = response.content[0].text;
  console.log(`📝 Claude response length: ${raw.length} chars`);
  console.log(`📝 Claude response start: ${raw.substring(0, 200)}`);
  console.log(`📝 Claude response end: ${raw.substring(raw.length - 200)}`);

  const cleaned = raw.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log('⚠️ Initial JSON parse failed, attempting repair...');

    // Find the JSON object
    const jsonStart = cleaned.indexOf('{');
    if (jsonStart === -1) throw new Error('Could not parse AI response. Please try again.');

    let partial = cleaned.substring(jsonStart);

    // Count unclosed brackets and repair
    let depth = 0;
    let arrDepth = 0;
    let inString = false;
    let escape = false;

    for (const ch of partial) {
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      if (ch === '}') depth--;
      if (ch === '[') arrDepth++;
      if (ch === ']') arrDepth--;
    }

    // Close any open structures
    for (let i = 0; i < arrDepth; i++) partial += ']';
    for (let i = 0; i < depth; i++) partial += '}';

    try {
      const repaired = JSON.parse(partial);
      console.log('✅ JSON repaired successfully');
      return repaired;
    } catch (e2) {
      console.log('❌ JSON repair failed:', e2.message);
      console.log('Raw response snippet:', cleaned.substring(0, 500));
      throw new Error('Could not parse AI response. Please try again.');
    }
  }
}
