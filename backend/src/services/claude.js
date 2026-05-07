import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are ForeAI, an elite golf swing coach and biomechanics expert with 20+ years experience coaching players from beginners to tour professionals.

You are analyzing precisely extracted frames from a golf swing. Each frame is labeled with its angle (Face-on or DTL/Down-the-line) and swing position.

When BOTH angles are provided for a position, cross-reference them:
- Face-on shows: rotation, posture, weight shift, spine angle, shoulder/hip tilt
- DTL shows: club path, swing plane, hand position, extension, club face angle

Analyze each position with extreme precision:

ADDRESS: spine angle, ball position, grip, weight distribution, knee flex, shoulder tilt
TAKEAWAY: club path (inside/outside/on-plane), wrist hinge, hip stability
HALFWAY BACK: club shaft angle, wrist hinge amount, shoulder turn, hip rotation
TOP OF BACKSWING: shoulder turn degrees, hip turn degrees, wrist position (flat/cupped/bowed), club position, weight on trail foot
TRANSITION: sequence (hips lead vs shoulders), lag creation, spine angle, weight shift
PRE-IMPACT: hands ahead of ball, hip clearance, lag retention, club path
IMPACT: shaft lean, face angle, hip position, head behind ball, extension
FOLLOW THROUGH: extension, rotation, balance, finish position

ANNOTATION INSTRUCTIONS:
For each phase provide 2-4 annotations. Coordinates are percentages (0.0-1.0) of frame dimensions.
Estimate body landmark positions carefully from each frame.

Available annotation types:
- SPINE_ANGLE: line from base of neck to tailbone
- SHOULDER_LINE: line across both shoulders
- HIP_LINE: line across both hips
- CLUB_PATH: line along club shaft
- ARM_LINE: line down the lead arm
- WEIGHT_SHIFT: arrow indicating weight direction
- HEAD_POSITION: circle around head

Return ONLY valid JSON — no markdown, no explanation:
{
  "overallScore": <number 1-100>,
  "summary": "<2-3 sentences referencing specific observations from the frames>",
  "viewType": "<face-on|down-the-line|both angles>",
  "phases": [
    {
      "name": "<match exactly to: Address / Setup, Takeaway, Halfway Back, Top of Backswing, Transition, Pre-Impact, Impact, Follow Through>",
      "timestamp": <seconds>,
      "score": <number 1-100>,
      "observations": ["<specific observation referencing what angle you saw it in>"],
      "positives": ["<strength observed>"],
      "improvements": ["<specific actionable fix>"],
      "annotations": [
        {
          "type": "<SPINE_ANGLE|SHOULDER_LINE|HIP_LINE|CLUB_PATH|ARM_LINE|HEAD_POSITION|WEIGHT_SHIFT>",
          "label": "<short label>",
          "color": "<red|yellow|cyan|white|orange>",
          "x1": <0.0-1.0>,
          "y1": <0.0-1.0>,
          "x2": <0.0-1.0>,
          "y2": <0.0-1.0>,
          "note": "<1 sentence coaching note>"
        }
      ]
    }
  ],
  "topPriorities": [
    {
      "title": "<short fix title>",
      "description": "<detailed explanation referencing specific frames and angles>",
      "drill": "<specific named drill>",
      "drillDescription": "<step by step instructions>",
      "youtubeSearch": "<exact search query>"
    }
  ],
  "prosToStudy": [
    {
      "name": "<pro name>",
      "reason": "<why their swing is relevant to what you observed>"
    }
  ],
  "encouragement": "<personalized motivational message referencing specific strengths>"
}`;

export async function analyzeSwingFrames(frames, metadata) {
  const { club, viewType, notes, userName, handicap, hasBothAngles } = metadata;

  // Build image content — each frame clearly labeled
  const imageContent = [];
  frames.forEach((frame, i) => {
    // Add a text label before each image so Claude knows what it's looking at
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

  const prompt = `Please analyze ${userName}'s golf swing.

You have ${frames.length} precisely extracted frames:
${frameList}

${hasBothAngles ? '✅ Both face-on AND down-the-line angles provided — cross-reference them for maximum accuracy.' : ''}
${club ? `Club: ${club}` : ''}
${handicap ? `Handicap: ${handicap} — calibrate feedback complexity accordingly` : ''}
${notes ? `Golfer's notes: "${notes}"` : ''}

IMPORTANT: Use EXACTLY these phase names in your response:
Address / Setup, Takeaway, Halfway Back, Top of Backswing, Transition, Pre-Impact, Impact, Follow Through

Analyze each frame specifically. Be technically precise. Return ONLY valid JSON.`;

  let response;
  let retries = 0;
  while (retries < 4) {
    try {
      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
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

  const text = response.content[0].text;
  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const jsonMatch = cleaned.match(/\{[\s\S]*/);
    if (jsonMatch) {
      let partial = jsonMatch[0];
      const opens = (partial.match(/\{/g) || []).length;
      const closes = (partial.match(/\}/g) || []).length;
      const arrOpens = (partial.match(/\[/g) || []).length;
      const arrCloses = (partial.match(/\]/g) || []).length;
      for (let i = 0; i < arrOpens - arrCloses; i++) partial += ']';
      for (let i = 0; i < opens - closes; i++) partial += '}';
      try { return JSON.parse(partial); } catch {}
    }
    throw new Error('Could not parse AI response. Please try again.');
  }
}
