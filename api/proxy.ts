export const config = {
  runtime: 'edge',
};

/**
 * Atelier Apex Orchestration Proxy
 * Stable, multi-provider AI routing layer
 * Compatible with Vercel Edge Runtime
 */

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { provider, apiKey, type, payload } = await req.json();

    if (!provider || !apiKey || !type || !payload?.prompt) {
      return json(
        {
          error: 'Missing provider, API key, request type, or prompt.',
          status: 'invalid_request',
        },
        400
      );
    }

    switch (provider) {
      case 'Gemini':
        return await safe(() => handleGemini(apiKey, type, payload), provider);

      case 'OpenAI':
        return await safe(() => handleOpenAI(apiKey, type, payload), provider);

      case 'Hugging Face':
        return await safe(
          () => handleHuggingFace(apiKey, type, payload),
          provider
        );

      case 'Stability AI':
        return await safe(
          () => handleStability(apiKey, type, payload),
          provider
        );

      default:
        return json(
          {
            error: `${provider} is not yet supported.`,
            status: 'unsupported',
          },
          501
        );
    }
  } catch (err: any) {
    return json(
      {
        error: 'Proxy fatal error.',
        details: err?.message || String(err),
        status: 'fatal',
      },
      500
    );
  }
}

/* -------------------------------------------------- */
/* Utility Helpers                                     */
/* -------------------------------------------------- */

async function safe(fn: () => Promise<Response>, provider: string) {
  try {
    return await fn();
  } catch (err: any) {
    return json(
      {
        error: `Interference detected in ${provider} sub-link.`,
        details: err?.message || String(err),
        status: 'interference',
      },
      502
    );
  }
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/* -------------------------------------------------- */
/* Providers                                           */
/* -------------------------------------------------- */

async function handleGemini(key: string, type: string, payload: any) {
  // Use latest models that work with v1beta generateContent
  const model =
    type === 'roadmap'
      ? 'gemini-1.5-pro-latest'
      : 'gemini-1.5-flash-latest';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: payload.prompt }],
        },
      ],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || 'Gemini request failed');
  }

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text)
      .join('') || '';

  return json({ result: text });
}

async function handleOpenAI(key: string, type: string, payload: any) {
  const isImage = type === 'image';

  const url = isImage
    ? 'https://api.openai.com/v1/images/generations'
    : 'https://api.openai.com/v1/chat/completions';

  const body = isImage
    ? {
        prompt: payload.prompt,
        n: 1,
        size: '1024x1024',
      }
    : {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: payload.prompt }],
      };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || 'OpenAI request failed');
  }

  const output = isImage
    ? data.data?.[0]?.url
    : data.choices?.[0]?.message?.content;

  return json({ result: output });
}

async function handleHuggingFace(key: string, type: string, payload: any) {
  const model =
    type === 'image'
      ? 'stabilityai/stable-diffusion-xl-base-1.0'
      : 'mistralai/Mistral-7B-Instruct-v0.2';

  // Use router with model-specific path
  const url = `https://router.huggingface.co/models/${model}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: payload.prompt }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Hugging Face inference failed');
  }

  if (type === 'image') {
    const blob = await res.blob();
    const buffer = await blob.arrayBuffer();
    // Edge runtime: use Uint8Array + btoa, not Node Buffer
    const base64 = btoa(
      new Uint8Array(buffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    return json({ result: `data:image/png;base64,${base64}` });
  }

  const data = await res.json();
  const text =
    Array.isArray(data)
      ? data[0]?.generated_text
      : data.generated_text || JSON.stringify(data);

  return json({ result: text });
}

async function handleStability(key: string, type: string, payload: any) {
  if (type !== 'image') {
    throw new Error('Stability AI only supports image generation.');
  }

  const res = await fetch(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [{ text: payload.prompt }],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 30,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok || data?.message) {
    throw new Error(data?.message || 'Stability AI failed');
  }

  const base64 = data.artifacts?.[0]?.base64;
  return json({ result: `data:image/png;base64,${base64}` });
}
