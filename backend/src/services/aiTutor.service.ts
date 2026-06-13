import https from 'https';

/**
 * AI tutor using Google's Gemini Flash via REST API.
 *
 * Why Gemini Flash:
 *  - Generous free tier (1500 req/day, 1M tokens/min) — enough for early operations
 *  - Fast (~1-2s response time)
 *  - Decent quality for educational Q&A
 *
 * Set GEMINI_API_KEY in .env to enable. If unset, the service throws gracefully so
 * the controller can return a clean error to the client.
 *
 * Get a key (free): https://aistudio.google.com/app/apikey
 */

const MODEL = 'gemini-1.5-flash';
const MAX_OUTPUT_TOKENS = 800;

interface AskOptions {
  question: string;
  context?: string;       // course/lesson content to ground the answer
  history?: { role: 'user' | 'model'; text: string }[];
}

const SYSTEM_INSTRUCTION = `You are a patient, encouraging tutor for E-Bringgs Technologies, a Nigerian tech-training platform. Your job is to help students understand concepts and unblock them when they're stuck.

Rules:
- Keep answers concise (under 250 words unless they ask for more depth).
- Use plain language. Code examples in Markdown fenced blocks.
- If the lesson context is provided, ground your answer in it. If the question is off-topic, answer briefly and gently steer back.
- Never make up facts about the platform's pricing, schedule, or curriculum — say "ask your instructor or check the dashboard" if unsure.
- If the student is frustrated, acknowledge it before explaining.
- End with a short follow-up question or next step when it helps the student progress.`;

export async function askGemini(opts: AskOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('AI tutor not configured. Set GEMINI_API_KEY in environment.');
  }

  const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

  // Stuff the lesson context as a leading user turn (Gemini doesn't have a system role on the contents endpoint)
  if (opts.context) {
    contents.push({
      role: 'user',
      parts: [{ text: `Reference material for this question:\n\n${opts.context}` }],
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Got it. I will refer to this material when answering.' }],
    });
  }

  // Prior chat history
  for (const turn of opts.history ?? []) {
    contents.push({ role: turn.role, parts: [{ text: turn.text }] });
  }

  // The actual question
  contents.push({ role: 'user', parts: [{ text: opts.question }] });

  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (res.statusCode && res.statusCode >= 400) {
              const msg = parsed?.error?.message || `Gemini API error (HTTP ${res.statusCode})`;
              return reject(new Error(msg));
            }
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
            if (!text) {
              const finishReason = parsed?.candidates?.[0]?.finishReason;
              if (finishReason === 'SAFETY') {
                return resolve("I can't answer that one. Try rephrasing the question, or ask your instructor.");
              }
              return reject(new Error('Empty response from Gemini'));
            }
            resolve(text.trim());
          } catch (e) {
            reject(new Error('Invalid JSON from Gemini'));
          }
        });
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
