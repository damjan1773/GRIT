import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_ENDPOINT,
  MAX_MEAL_TEXT_LENGTH,
  geminiRequestBody,
} from '../src/services/geminiRequest';

/**
 * Vercel function for the web build: the page posts { text } and this calls
 * Gemini with a key that lives only in Vercel's settings (GEMINI_API_KEY), so the
 * key never reaches the browser. Gemini's status and body come back unchanged,
 * and the app reads them exactly as it reads a direct call.
 */
export async function POST(request: Request): Promise<Response> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    // 401, so the app tells the user the key is missing rather than "overloaded".
    return json(401, { error: 'GEMINI_API_KEY is not set on the server.' });
  }

  let text: unknown;
  try {
    text = ((await request.json()) as { text?: unknown })?.text;
  } catch {
    return json(400, { error: 'Expected a JSON body.' });
  }
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_MEAL_TEXT_LENGTH) {
    return json(400, { error: `"text" must be 1–${MAX_MEAL_TEXT_LENGTH} characters.` });
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const upstream = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(geminiRequestBody(text.trim(), model)),
  });

  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  });
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
