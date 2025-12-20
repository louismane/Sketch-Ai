export const config = {
  runtime: 'edge',
};

/**
 * Atelier Apex Orchestration Proxy
 * Stable, multi-provider AI routing layer
 * Compatible with Vercel Edge Runtime
 */

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return json({}, 204);
  }

  if (req.method !== 'POST') {
    return json(
      { error: 'Method Not Allowed' },
      405
    );
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

      case 'GeminiListModels':
        return await safe(() => listGeminiModels(apiKey), provider);

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

/* Utility Helpers */

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
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/* Base64 helper function */

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

/* Providers */

/** Gemini AI - Google Generative Language API (latest 2025) */
async function handleGemini(key: string, type: string, payload: any) {
  // Updated model names per 2025 latest API
  const model =
    type === 'roadmap'
      ? 'models/gemini-pro-latest'       // Pro roadmap model
      : 'models/gemini-flash-latest';    // General chat model

  const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'SketchAI-Proxy/1.0',
    },
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

async function listGeminiModels(key: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'SketchAI-Proxy/1.0',
    },
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error?.message || 'Failed to list Gemini models');
  }

  const data = await res.json();
  return json({ models: data.models });
}

/** OpenAI - Latest recommended 2025 usage */
async function handleOpenAI(key: string, type: string, payload: any) {
  const isImage = type === 'image';

  const url = isImage
    ? 'https://api.openai.com/v1/images/generations'
    : 'https://api.openai.com/v1/chat/completions';

  // Use GPT-4o if available, fallback to GPT-4o-mini (mini is smaller and faster)
  const chatModel = 'gpt-4o';

  const body = isImage
    ? {
        prompt: payload.prompt,
        n: 1,
        size: '1024x1024',
      }
    : {
        model: chatModel,
        messages: [{ role: 'user', content: payload.prompt }],
      };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SketchAI-Proxy/1.0',
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

/** Hugging Face - Updated 2025 models and API */
async function handleHuggingFace(key: string, type: string, payload: any) {
  // Use popular 2025 models for text and image generation
  const model =
    type === 'image'
      ? 'stabilityai/stable-diffusion-xl-base-1.0' // Stable Diffusion XL v1.0 for images
      : 'tiiuae/falcon-40b-instruct';             // Falcon 40B Instruct for text

  const url = `https://api-inference.huggingface.co/models/${model}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SketchAI-Proxy/1.0',
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
    const base64 = arrayBufferToBase64(buffer);

    return json({ result: `data:image/png;base64,${base64}` });
  }

  const data = await res.json();

  // Falcon 40B returns generated_text in an array or object
  const text =
    Array.isArray(data)
      ? data[0]?.generated_text
      : data.generated_text || JSON.stringify(data);

  return json({ result: text });
}

/** Stability AI - Latest v2025 stable diffusion endpoint */
async function handleStability(key: string, type: string, payload: any) {
  if (type !== 'image') {
    throw new Error('Stability AI only supports image generation.');
  }

  const url =
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'SketchAI-Proxy/1.0',
    },
    body: JSON.stringify({
      text_prompts: [{ text: payload.prompt }],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      samples: 1,
      steps: 30,
    }),
  });

  const data = await res.json();

  if (!res.ok || data?.message) {
    throw new Error(data?.message || 'Stability AI failed');
  }

  const base64 = data.artifacts?.[0]?.base64;
  return json({ result: `data:image/png;base64,${base64}` });
}
