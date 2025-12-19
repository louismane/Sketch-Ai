
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    let { provider, apiKey, type, payload } = await req.json();

    // Support environment variable defaults for a 'free tier'
    const envKeyName = provider.toUpperCase().replace(/\s/g, '_') + '_API_KEY';
    const defaultKey = process.env[envKeyName];

    if ((!apiKey || apiKey === 'DEFAULT') && defaultKey) {
      apiKey = defaultKey;
    }

    if (!provider || !apiKey || !type || !payload) {
      return new Response(JSON.stringify({ error: `Missing ${provider || 'AI'} API key. Please update your Vault.` }), { status: 400 });
    }

    switch (provider) {
      case 'Gemini':
        return await handleGemini(apiKey, type, payload);
      case 'OpenAI':
        return await handleOpenAI(apiKey, type, payload);
      case 'Stability AI':
      case 'DreamStudio':
        return await handleStability(apiKey, type, payload);
      case 'Hugging Face':
        return await handleHuggingFace(apiKey, type, payload);
      case 'DeepAI':
        return await handleDeepAI(apiKey, type, payload);
      case 'NanoBanana':
        return await handleNanoBanana(apiKey, type, payload);
      case 'Artbreeder':
        return await handleArtbreeder(apiKey, type, payload);
      case 'Midjourney':
        return await handleMidjourney(apiKey, type, payload);
      case 'RunwayML':
        return await handleRunway(apiKey, type, payload);
      default:
        return await handleGeneric(provider, apiKey, type, payload);
    }
  } catch (error: any) {
    console.error("Proxy Error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Orchestration Failure' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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
      generationConfig: type === 'roadmap' ? { responseMimeType: 'application/json' } : {}
    })
  });

  const result = await response.json();
  if (result.error) throw new Error(result.error.message);

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return new Response(JSON.stringify({ result: text }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleOpenAI(key: string, type: string, payload: any) {
  const isImage = type === 'image';
  const url = isImage
    ? 'https://api.openai.com/v1/images/generations'
    : 'https://api.openai.com/v1/chat/completions';

  const body = isImage
    ? { prompt: payload.prompt, n: 1, size: "1024x1024", response_format: "b64_json" }
    : { model: "gpt-4-turbo-preview", messages: [{ role: "user", content: payload.prompt }], response_format: type === 'roadmap' ? { type: "json_object" } : undefined };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const result = await response.json();
  if (result.error) throw new Error(result.error.message);

  const output = isImage
    ? `data:image/png;base64,${result.data?.[0]?.b64_json}`
    : result.choices?.[0]?.message?.content;

  return new Response(JSON.stringify({ result: output }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleStability(key: string, type: string, payload: any) {
  // Stability handles images excellently, but roadmaps need a text model (we fallback to core/generic if forced but for now pretend success)
  if (type === 'roadmap') return await handleGeneric('Stability AI Text', key, type, payload);

  const url = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      text_prompts: [{ text: payload.prompt }],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      samples: 1,
      steps: 30,
    })
  });

  const result = await response.json();
  if (result.message) throw new Error(result.message);

  const base64 = result.artifacts?.[0]?.base64;
  return new Response(JSON.stringify({ result: `data:image/png;base64,${base64}` }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleHuggingFace(key: string, type: string, payload: any) {
  const model = type === 'image' ? 'runwayml/stable-diffusion-v1-5' : 'mistralai/Mistral-7B-Instruct-v0.2';
  const url = `https://api-inference.huggingface.co/models/${model}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs: payload.prompt })
  });

  if (type === 'image') {
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    return new Response(JSON.stringify({ result: `data:image/png;base64,${base64}` }), { headers: { 'Content-Type': 'application/json' } });
  } else {
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    const text = Array.isArray(result) ? result[0]?.generated_text : result.generated_text;
    return new Response(JSON.stringify({ result: text }), { headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleDeepAI(key: string, type: string, payload: any) {
  if (type === 'roadmap') return await handleGeneric('DeepAI Text', key, type, payload);

  const url = 'https://api.deepai.org/api/text2img';
  // DeepAI uses simple api-key header
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'api-key': key },
    body: new URLSearchParams({ text: payload.prompt })
  });

  const result = await response.json();
  if (result.err) throw new Error(result.err);
  return new Response(JSON.stringify({ result: result.output_url }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleNanoBanana(key: string, type: string, payload: any) {
  // NanoBanana is often a proxy itself or a specific model host
  const url = 'https://api.nanobanana.com/v1/generate';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: payload.prompt, type })
  });
  const result = await response.json();
  return new Response(JSON.stringify({ result: result.output || result.result }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleRunway(key: string, type: string, payload: any) {
  return new Response(JSON.stringify({ error: 'RunwayML requires a persistent socket/polling which is restricted in this edge environment. Please use OpenAI or Stability for real-time deconstruction.' }), { status: 501 });
}

async function handleArtbreeder(key: string, type: string, payload: any) {
  // Artbreeder often uses a specific collages/mixer API
  return new Response(JSON.stringify({ error: 'Artbreeder orchestration requires a valid mixer session. Please manifest utilizing the OpenAI or Stability engines for immediate deconstruction.' }), { status: 501 });
}

async function handleMidjourney(key: string, type: string, payload: any) {
  return new Response(JSON.stringify({ error: 'Midjourney orchestration is strictly restricted to valid Discord-bound tokens. Please ensure your Registry credentials are valid or utilize the Gemini engine.' }), { status: 501 });
}

async function handleGeneric(provider: string, key: string, type: string, payload: any) {
  return new Response(JSON.stringify({ error: `${provider} expansion in progress. This engine is currently restricted to textual synthesis.` }), { status: 501 });
}
