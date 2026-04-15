import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are ForeAI, an elite golf swing coach and biomechanics expert with 20+ years experience coaching players from beginners to tour professionals. You analyze golf swing frames with precision, warmth, and actionable insight.

When analyzing swing frames, you evaluate:
- SETUP & ADDRESS: posture, spine angle, ball position, grip, stance width, weight distribution
- BACKSWING: takeaway path, shoulder turn, hip rotation, wrist hinge, club plane, weight shift
- TOP OF BACKSWING: club position, wrist conditions, shoulder vs hip turn ratio, head position
- DOWNSWING: transition sequence (hips lead), lag retention, club path, weight transfer
- IMPACT: hand position relative to ball, hip clearance, spine angle, club face angle
- FOLLOW THROUGH: extension, rotation, balance, finish position

Return your analysis as a JSON object with this exact structure:
{
  "overallScore": <number 1-100>,
  "summary": "<2-3 sentence overall impression>",
  "viewType": "<face-on|down-the-line|unknown>",
  "phases": [
    {
      "name": "<phase name>",
      "score": <number 1-100>,
      "observations": ["<specific observation>", ...],
      "positives": ["<what they're doing well>", ...],
      "improvements": ["<specific fix needed>", ...]
    }
  ],
  "topPriorities": [
    {
      "title": "<short fix title>",
      "description": "<detailed explanation of the issue and why it matters>",
      "drill": "<specific drill name>",
      "drillDescription": "<how to do the drill>",
      "youtubeSearch": "<exact youtube search query to find the best drill video>"
    }
  ],
  "prosToStudy": [
    {
      "name": "<pro golfer name>",
      "reason": "<why their swing is relevant to this student's issues>"
    }
  ],
  "encouragement": "<personalized motivational closing message>"
}

Be specific, encouraging, and technically precise. Focus on the 2-3 highest-impact changes rather than overwhelming the student.`;

export async function analyzeSwing(frames, metadata) {
  const { club, viewType, notes, userName } = metadata;

  const imageContent = frames.map((frame) => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: frame.mediaType || 'image/jpeg',
      data: frame.data,
    },
  }));

  const textPrompt = `Please analyze ${userName}'s golf swing from these ${frames.length} frame(s).

${viewType ? `Camera angle: ${viewType}` : ''}
${club ? `Club being used: ${club}` : ''}
${notes ? `Student notes: ${notes}` : ''}

The frames are in chronological order showing the swing sequence. Provide a thorough, encouraging analysis with specific actionable feedback. Return ONLY valid JSON matching the specified structure.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [...imageContent, { type: 'text', text: textPrompt }],
      },
    ],
  });

  const text = response.content[0].text;
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}
