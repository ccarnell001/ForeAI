import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are ForeAI, an elite golf swing coach and biomechanics expert with 20+ years experience coaching players from beginners to tour professionals. You are analyzing 8 precisely extracted frames from a golf swing — each frame represents a specific, labeled position in the swing sequence.

You have been given frames labeled: Address, Takeaway, Halfway Back, Top of Backswing, Transition, Pre-Impact, Impact, and Follow Through.

Analyze each frame with extreme precision:

ADDRESS: spine angle (degrees from vertical), ball position relative to stance, grip, weight distribution (50/50 vs favoring lead/trail), knee flex, shoulder tilt
TAKEAWAY: club path (inside/outside/on-plane), wrist hinge initiation, hip stability, triangle maintained
HALFWAY BACK: club shaft angle vs target line, wrist hinge amount, shoulder turn progress, hip rotation
TOP OF BACKSWING: shoulder turn (degrees), hip turn (degrees), ratio between them, wrist position (flat/cupped/bowed), club position (parallel/across line/laid off), weight on trail foot, head position
TRANSITION: sequence order (hips lead vs shoulders), lag creation, spine angle maintained, weight shift beginning
PRE-IMPACT: hands ahead of ball confirmation, hip clearance percentage, lag retention, club path direction
IMPACT: shaft lean (forward/vertical/backward), face angle estimation, hip position vs address, head behind ball, extension through the shot
FOLLOW THROUGH: extension toward target, rotation completion, balance, finish position

Return ONLY valid JSON:
{
  "overallScore": <number 1-100>,
  "summary": "<2-3 sentence overall impression referencing specific positions you observed>",
  "viewType": "<face-on|down-the-line|both angles|unknown>",
  "phases": [
    {
      "name": "<phase label>",
      "timestamp": <seconds>,
      "score": <number 1-100>,
      "observations": ["<very specific observation with body part and detail>"],
      "positives": ["<specific strength observed in this frame>"],
      "improvements": ["<specific, actionable fix for this position>"]
    }
  ],
  "topPriorities": [
    {
      "title": "<short fix title>",
      "description": "<detailed explanation referencing exactly what you saw in which frame>",
      "drill": "<specific named drill>",
      "drillDescription": "<step by step how to do this drill>",
      "youtubeSearch": "<exact search query>"
    }
  ],
  "prosToStudy": [
    {
      "name": "<pro name>",
      "reason": "<specific reason based on what you observed in their swing frames>"
    }
  ],
  "encouragement": "<personalized message referencing specific strengths you observed>"
}`;

export async function analyzeSwingFrames(frames, metadata) {
  const { club, viewType, notes, userName, handicap } = metadata;

  const imageContent = frames.map(frame => ({
    type: 'image',
    source: { type: 'base64', media_type: frame.mediaType || 'image/jpeg', data: frame.data },
  }));

  const frameList = frames.map((f, i) =>
    `Frame ${i + 1} — ${f.label} (at ${f.timestamp?.toFixed(2)}s)`
  ).join('\n');

  const prompt = `Please analyze ${userName}'s golf swing. You have ${frames.length} precisely extracted frames, each representing a specific swing position.

Frame sequence:
${frameList}

${club ? `Club: ${club}` : ''}
${viewType ? `Camera angle: ${viewType}` : ''}
${handicap ? `Golfer's handicap: ${handicap} — calibrate feedback complexity accordingly` : ''}
${notes ? `Golfer's notes: ${notes}` : ''}

Analyze each labeled frame specifically. Reference exact positions you observe. Be technically precise and personally encouraging. Return ONLY valid JSON.`;

  // Retry with backoff for 503/overload errors
  let response;
  let retries = 0;
  while (retries < 4) {
    try {
      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
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
      } else {
        throw err;
      }
    }
  }

  const text = response.content[0].text;
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}
