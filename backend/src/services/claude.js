import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are ForeAI, an elite golf swing coach and biomechanics expert with 20+ years experience.

You are analyzing 8 evenly-spaced frames captured across the entire golf swing, from address through follow-through. The frames are labeled in chronological order:
1. Address / Setup
2. Takeaway  
3. Halfway Back
4. Top of Backswing
5. Transition
6. Pre-Impact
7. Impact
8. Follow Through

You also have observations from Gemini AI which watched the FULL VIDEO — use these to understand motion, tempo, and patterns between frames that static images can't show.

When BOTH face-on AND DTL frames are provided, cross-reference them:
- Face-on: rotation, posture, weight shift, spine angle
- DTL: club path, swing plane, hand position, club face

Analyze each frame carefully:
ADDRESS: spine angle, ball position, grip, stance width, weight distribution, posture
TAKEAWAY: club path (inside/outside/on-plane), wrist conditions, hip stability
HALFWAY BACK: club shaft angle, wrist hinge, shoulder turn progress
TOP OF BACKSWING: shoulder vs hip turn ratio, wrist position (flat/cupped/bowed), club position, weight
TRANSITION: sequence (hips lead?), lag creation, spine angle maintenance
PRE-IMPACT: hands ahead of ball, hip clearance, lag retention
IMPACT: shaft lean, face angle estimate, hip position, head behind ball
FOLLOW THROUGH: extension, rotation, balance, finish position

ANNOTATION INSTRUCTIONS:
For each phase provide 2-3 annotations. Coordinates are percentages (0.0-1.0) of frame dimensions.
Types: SPINE_ANGLE, SHOULDER_LINE, HIP_LINE, CLUB_PATH, ARM_LINE, WEIGHT_SHIFT, HEAD_POSITION
Colors: red, yellow, cyan, white, orange

Return ONLY valid JSON starting with {:
{
  "overallScore": <1-100>,
  "summary": "<2-3 sentences referencing both frame observations and video motion analysis>",
  "viewType": "<face-on|down-the-line|both angles>",
  "phases": [
    {
      "name": "<exact label: Address / Setup, Takeaway, Halfway Back, Top of Backswing, Transition, Pre-Impact, Impact, Follow Through>",
      "timestamp": <seconds>,
      "score": <1-100>,
      "observations": ["<specific observation>"],
      "positives": ["<strength>"],
      "improvements": ["<actionable fix>"],
      "annotations": [
        {
          "type": "<type>",
          "label": "<short label>",
          "color": "<color>",
          "x1": <0.0-1.0>, "y1": <0.0-1.0>,
          "x2": <0.0-1.0>, "y2": <0.0-1.0>,
          "note": "<coaching note>"
        }
      ]
    }
  ],
  "topPriorities": [
    {
      "title": "<title>",
      "description": "<description referencing specific frames and video observations>",
      "drill": "<drill name>",
      "drillDescription": "<how to do it>",
      "youtubeSearch": "<search query>"
    }
  ],
  "prosToStudy": [{"name": "<name>", "reason": "<reason>"}],
  "encouragement": "<personalized message>"
}`;

export async function analyzeSwingFrames(frames, metadata) {
  const { club, viewType, notes, userName, handicap, hasBothAngles, videoObservations } = metadata;

  const imageContent = [];
  frames.forEach((frame, i) => {
    imageContent.push({
      type: 'text',
      text: `Frame ${i + 1} of ${frames.length} — ${frame.displayLabel || frame.label} @ ${frame.timestamp?.toFixed(2)}s:`,
    });
    imageContent.push({
      type: 'image',
      source: { type: 'base64', media_type: frame.mediaType || 'image/jpeg', data: frame.data },
    });
  });

  const frameList = frames.map((f, i) =>
    `Frame ${i + 1}: ${f.displayLabel || f.label} @ ${f.timestamp?.toFixed(2)}s`
  ).join('\n');

  // Format Gemini's video observations
  const geminiContext = videoObservations ? `
GEMINI VIDEO ANALYSIS (from watching the full swing video):
- Tempo: ${videoObservations.tempo || 'Not observed'}
- Takeaway: ${videoObservations.takeaway || 'Not observed'}
- Backswing: ${videoObservations.backswing || 'Not observed'}
- Transition: ${videoObservations.transition || 'Not observed'}
- Downswing: ${videoObservations.downswing || 'Not observed'}
- Impact: ${videoObservations.impact || 'Not observed'}
- Follow Through: ${videoObservations.followThrough || 'Not observed'}
- Key Faults Observed in Video: ${videoObservations.keyFaults?.join('; ') || 'None noted'}
- Key Strengths Observed in Video: ${videoObservations.keyStrengths?.join('; ') || 'None noted'}

Use these video observations to add context to what you see in the frames.` : '';

  const prompt = `Analyze ${userName}'s golf swing.

FRAMES PROVIDED (8 evenly-spaced across the swing):
${frameList}

${geminiContext}
${hasBothAngles ? '✅ Both face-on AND DTL angles provided — cross-reference for maximum accuracy.' : ''}
${club ? `Club: ${club}` : ''}
${handicap ? `Handicap: ${handicap} — calibrate feedback accordingly` : ''}
${notes ? `Golfer notes: "${notes}"` : ''}

Analyze each frame precisely. Use Gemini's video observations to understand motion between frames. Return ONLY valid JSON starting with {.`;

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
        console.log(`Claude overloaded, retrying in ${wait/1000}s...`);
        await new Promise(r => setTimeout(r, wait));
      } else throw err;
    }
  }

  const raw = response.content[0].text;
  console.log(`📝 Claude response: ${raw.length} chars`);

  const cleaned = raw.replace(/```json|```/g, '').trim();
  const jsonStart = cleaned.indexOf('{');
  if (jsonStart === -1) throw new Error('Could not parse AI response. Please try again.');
  const jsonStr = cleaned.substring(jsonStart);

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.log('⚠️ Repairing JSON...');
    let partial = jsonStr;
    const opens = (partial.match(/\{/g) || []).length;
    const closes = (partial.match(/\}/g) || []).length;
    const arrOpens = (partial.match(/\[/g) || []).length;
    const arrCloses = (partial.match(/\]/g) || []).length;
    for (let i = 0; i < arrOpens - arrCloses; i++) partial += ']';
    for (let i = 0; i < opens - closes; i++) partial += '}';
    try { return JSON.parse(partial); }
    catch { throw new Error('Could not parse AI response. Please try again.'); }
  }
}
