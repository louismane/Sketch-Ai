export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { provider, apiKey, prompt } = await req.json();

    if (!provider || !apiKey || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing provider, API key, or prompt' }),
        { status: 400 }
      );
    }

    if (provider === 'Gemini') {
      return await handleGemini(apiKey, prompt);
    }

    if (provider === 'OpenAI') {
      return await handleOpenAI(apiKey, prompt);
    }

    return new Response(
      JSON.stringify({
        error: `${provider} is not yet supported in production.`,
      }),
      { status: 501 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: 'Proxy failure',
        details: err.message,
      }),
      { status: 500 }
    );
  }
}

/* ================= GEMINI (FIXED) ================= */

async function handleGemini(apiKey: string, prompt: string) {
  const url =
    'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=' +
    apiKey;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error?.message || 'Gemini request failed');
  }

  const text =
    json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  return new Response(JSON.stringify({ result: text }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/* ================= OPENAI (TEXT ONLY) ================= */

async function handleOpenAI(apiKey: string, prompt: string) {
  const res = await fetch(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      }),
    }
  );

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error?.message || 'OpenAI request failed');
  }

  return new Response(
    JSON.stringify({
      result: json.choices?.[0]?.message?.content,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
