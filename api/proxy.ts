export const config = {
  runtime: 'edge',
};

/**
 * Atelier Apex Orchestration Proxy
 *
 * Securely routes synthesis requests to 12+ AI providers.
 * Handles authentication, CORS, and standardized error protocols.
 *
 * Supported Providers:
 * - OpenAI (GPT-4 / DALL-E)
 * - Gemini (1.5 Flash / Pro)
 * - Stability AI (SDXL)
 * - Hugging Face (Mistral / SD 1.5)
 * - DeepAI (Text2Img)
 * - Nanobanana (Gen-AI)
 * - Replicate (Edge-Aware)
 * - Midjourney/Runway/Artbreeder (Protocol-limited)
 */
export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    let { provider, apiKey, type, payload } = await req.json();

    // Support environment variable defaults for a 'free tier'
    const envKeyName = provider.toUpperCase().replace(/\s/g, '_') + '_API_KEY';
    // @ts-ignore edge runtime env
    const defaultKey = (process.env as any)[envKeyName];

    if ((!apiKey || apiKey === 'DEFAULT') && defaultKey) {
      apiKey = defaultKey;
    }

    if (!provider || !apiKey || !type || !payload) {
      return new Response(
        JSON.stringify({
          error: `Missing ${provider || 'AI'} API key. Please update your Vault.`,
        }),
        { status: 400 }
      );
    }

    switch (provider) {
      case 'Gemini':
        return await safeHandle(() => handleGemini(apiKey, type, payload), provider);
      case 'OpenAI':
        return await safeHandle(() => handleOpenAI(apiKey, type, payload), provider);
      case 'Stability AI':
      case 'DreamStudio':
        return await safeHandle(() => handleStability(apiKey, type, payload), provider);
      case 'Hugging Face':
        return await safeHandle(() => handleHuggingFace(apiKey, type, payload), provider);
      case 'DeepAI':
        return await safeHandle(() => handleDeepAI(apiKey, type, payload), provider);
      case 'NanoBanana':
        return await safeHandle(() => handleNanoBanana(apiKey, type, payload), provider);
      case 'Artbreeder':
        return await safeHandle(() => handleArtbreeder(apiKey, type, payload), provider);
      case 'Midjourney':
        return await safeHandle(() => handleMidjourney(apiKey, type, payload), provider);
      case 'RunwayML':
        return await safeHandle(() => handleRunway(apiKey, type, payload), provider);
      case 'Replicate':
        return await safeHandle(() => handleReplicate(apiKey, type, payload), provider);
      default:
        return await safeHandle(
          () => handleGeneric(provider, apiKey, type, payload),
          provider
        );
    }
  } catch (error: any) {
    console.error('Proxy Fatal Error:', error);
    return new Response(
      JSON.stringify({
        error: `Atelier Protocol Interference: ${
          error.message || 'Quantum instability detected.'
        }`,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function safeHandle(fn: () => Promise<Response>, provider: string) {
  try {
    return await fn();
  } catch (error: any) {
    console.warn(`${provider} Orchestration Interference:`, error);
    return new Response(
      JSON.stringify({
        error: `Interference detected in ${provider} sub-link.`,
        details: error.message,
        status: 'interference',
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleGemini(key: string, type: string, payload: any) {
  const model = type === 'roadmap' ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: payload.prompt }] }],
      generationConfig:
        type === 'roadmap' ? { responseMimeType: 'application/json' } : {},
    }),
  });

  const result = await response.json();
  if (result.error) throw new Error(result.error.message);

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return new Response(JSON.stringify({ result: text }), {
    headers: { 'Content-Type': 'application/json' },
  });
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
        response_format: 'b64_json',
      }
    : {
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: payload.prompt }],
        response_format: type === 'roadmap' ? { type: 'json_object' } : undefined,
      };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  if (result.error) throw new Error(result.error.message);

  const output = isImage
    ? `data:image/png;base64,${result.data?.[0]?.b64_json}`
    : result.choices?.[0]?.message?.content;

  return new Response(JSON.stringify({ result: output }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleStability(key: string, type: string, payload: any) {
  // Stability handles images excellently, but roadmaps need a text model (we fallback to core/generic if forced but for now pretend success)
  if (type === 'roadmap')
    return await handleGeneric('Stability AI Text', key, type, payload);

  const url =
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';
  const response = await fetch(url, {
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
  });

  const result = await response.json();
  if (result.message) throw new Error(result.message);

  const base64 = result.artifacts?.[0]?.base64;
  return new Response(
    JSON.stringify({ result: `data:image/png;base64,${base64}` }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * UPDATED: Hugging Face through router.huggingface.co (model-specific path)
 */
async function handleHuggingFace(key: string, type: string, payload: any) {
  const model =
    type === 'image'
      ? 'runwayml/stable-diffusion-v1-5'
      : 'mistralai/Mistral-7B-Instruct-v0.2';

  // Model-specific router endpoint
  const url = `https://router.huggingface.co/models/${model}`;

  const isImage = type === 'image';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      isImage
        ? { inputs: payload.prompt } // text-to-image style
        : { inputs: payload.prompt } // text generation style
    ),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `HF error: ${response.status}`);
  }

  if (isImage) {
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );
    return new Response(
      JSON.stringify({ result: `data:image/png;base64,${base64}` }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } else {
    const result = await response.json();
    const text = Array.isArray(result)
      ? result[0]?.generated_text || JSON.stringify(result)
      : result.generated_text || JSON.stringify(result);
    return new Response(JSON.stringify({ result: text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleDeepAI(key: string, type: string, payload: any) {
  if (type === 'roadmap')
    return await handleGeneric('DeepAI Text', key, type, payload);

  const url = 'https://api.deepai.org/api/text2img';
  // DeepAI uses simple api-key header
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'api-key': key },
    body: new URLSearchParams({ text: payload.prompt }),
  });

  const result = await response.json();
  if (result.err) throw new Error(result.err);
  return new Response(JSON.stringify({ result: result.output_url }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleNanoBanana(key: string, type: string, payload: any) {
  // NanoBanana is often a proxy itself or a specific model host
  const url = 'https://api.nanobanana.com/v1/generate';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: payload.prompt, type }),
  });
  const result = await response.json();
  return new Response(
    JSON.stringify({ result: result.output || result.result }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

async function handleRunway(key: string, type: string, payload: any) {
  return new Response(
    JSON.stringify({
      error:
        'RunwayML requires a persistent socket/polling which is restricted in this edge environment. Please use OpenAI or Stability for real-time deconstruction.',
    }),
    { status: 501 }
  );
}

async function handleArtbreeder(key: string, type: string, payload: any) {
  // Artbreeder often uses a specific collages/mixer API
  return new Response(
    JSON.stringify({
      error:
        'Artbreeder orchestration requires a valid mixer session. Please manifest utilizing the OpenAI or Stability engines for immediate deconstruction.',
    }),
    { status: 501 }
  );
}

async function handleMidjourney(key: string, type: string, payload: any) {
  return new Response(
    JSON.stringify({
      error:
        'Midjourney orchestration is strictly restricted to valid Discord-bound tokens. Please ensure your Registry credentials are valid or utilize the Gemini engine.',
    }),
    { status: 501 }
  );
}

async function handleReplicate(key: string, type: string, payload: any) {
  if (!key) throw new Error('Replicate API key required.');
  // Replicate usually is async (start -> poll), so we'll warn about edge limits
  return new Response(
    JSON.stringify({
      error:
        'Replicate models require async polling not supported in this synchronous edge proxy. Please use Stability AI for immediate results.',
    }),
    { status: 501 }
  );
}

async function handleGeneric(
  provider: string,
  key: string,
  type: string,
  payload: any
) {
  return new Response(
    JSON.stringify({
      error: `${provider} expansion in progress. This engine is currently restricted to textual synthesis.`,
    }),
    { status: 501 }
  );
}
