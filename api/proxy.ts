export const config = {
  runtime: 'edge',
};

/**
 * Atelier Apex Orchestration Proxy - 2025
 * Multi-provider AI routing with demo/test mode support
 * Compatible with Vercel Edge Runtime
 */

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return json({}, 204);
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (e: any) {
      return json(
        {
          error: 'Invalid JSON in request body.',
          details: e?.message || String(e),
          status: 'invalid_json',
        },
        400
      );
    }

    let { provider, apiKey, type, payload } = body;

    // Normalize provider names
    if (provider === 'gemini') provider = 'Gemini';
    if (provider === 'openai') provider = 'OpenAI';
    if (provider === 'huggingface') provider = 'Hugging Face';
    if (provider === 'stability') provider = 'Stability AI';

    // Check for demo mode (for testing without real keys)
    const DEMO_MODE = process.env.DEMO_MODE === 'true' || process.env.VITE_DEMO_MODE === 'true';

    // Auto-inject API keys from env
    if (!apiKey && !DEMO_MODE) {
      switch (provider) {
        case 'Gemini':
        case 'GeminiListModels':
          apiKey =
            process.env.GEMINI_API_KEY ||
            process.env.VITE_GEMINI_API_KEY ||
            '';
          break;
        case 'OpenAI':
          apiKey =
            process.env.OPENAI_API_KEY ||
            process.env.VITE_OPENAI_API_KEY ||
            '';
          break;
        case 'Hugging Face':
          apiKey =
            process.env.HF_API_KEY ||
            process.env.HUGGINGFACE_API_KEY ||
            '';
          break;
        case 'Stability AI':
          apiKey =
            process.env.STABILITY_API_KEY ||
            process.env.STABILITYAI_API_KEY ||
            '';
          break;
      }
    }

    // In DEMO_MODE, provide placeholder key to pass validation
    if (DEMO_MODE && !apiKey) {
      apiKey = 'DEMO_MODE_KEY';
    }

    if (!provider || !type || !payload?.prompt || !apiKey) {
      return json(
        {
          error:
            'Missing provider, API key, request type, or prompt.',
          details: DEMO_MODE ? 'Demo mode enabled' : 'Check environment variables',
          status: 'invalid_request',
        },
        400
      );
    }

    // In DEMO_MODE, return mock responses for testing
    if (DEMO_MODE) {
      return await demoHandler(provider, type, payload);
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
    console.error('[Proxy Fatal Error]', err);
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

/** Demo/Test mode response handler */
async function demoHandler(provider: string, type: string, payload: any) {
  // Generate realistic mock responses
  const prompt = payload.prompt || '';
  const mockResponses: {[key: string]: string} = {
    roadmap: 'Generated learning roadmap: Foundation → Intermediate → Advanced → Mastery',
    synthesis: 'Synthesized art direction with contemporary design principles',
    analysis: 'Visual analysis complete. Technical composition identified.',
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="256"%3E%3Crect width="256" height="256" fill="%234a5568"/%3E%3Ccircle cx="128" cy="128" r="64" fill="%2363b3f5"/%3E%3C/svg%3E',
    default: `Processed: ${prompt.substring(0, 50)}... [${provider} | ${type}]`,
  };

  const result = mockResponses[type] || mockResponses.default;
  return json({ result, mode: 'DEMO', provider, timestamp: new Date().toISOString() });
}

/* Utility Helpers */

async function safe(fn: () => Promise<Response>, provider: string) {
  try {
    return await fn();
  } catch (err: any) {
    console.error(`[${provider} Error]`, err?.message);
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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

/* Providers */

/** Gemini AI - Google Generative Language API (2025) */
async function handleGemini(key: string, type: string, payload: any) {
  const model =
    type === 'roadmap'
      ? 'models/gemini-pro-latest'
      : 'models/gemini-flash-latest';

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
    throw new Error(data?.error?.message || `Gemini API error: ${res.status}`);
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

/** OpenAI - Latest 2025 models */
async function handleOpenAI(key: string, type: string, payload: any) {
  const isImage = type === 'image';

  const url = isImage
    ? 'https://api.openai.com/v1/images/generations'
    : 'https://api.openai.com/v1/chat/completions';

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
    throw new Error(data?.error?.message || `OpenAI API error: ${res.status}`);
  }

  const output = isImage
    ? data.data?.[0]?.url
    : data.choices?.[0]?.message?.content;

  return json({ result: output });
}

/** Hugging Face - 2025 models */
async function handleHuggingFace(key: string, type: string, payload: any) {
  const model =
    type === 'image'
      ? 'stabilityai/stable-diffusion-xl-base-1.0'
      : 'tiiuae/falcon-40b-instruct';

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
    throw new Error(err || `Hugging Face error: ${res.status}`);
  }

  if (type === 'image') {
    const blob = await res.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);

    return json({ result: `data:image/png;base64,${base64}` });
  }

  const data = await res.json();
  const text =
    Array.isArray(data)
      ? data[0]?.generated_text
      : data.generated_text || JSON.stringify(data);

  return json({ result: text });
}

/** Stability AI - Latest 2025 models */
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
    throw new Error(data?.message || `Stability AI error: ${res.status}`);
  }

  const base64 = data.artifacts?.[0]?.base64;
  return json({ result: `data:image/png;base64,${base64}` });
}
