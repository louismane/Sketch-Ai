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

    // Auto-inject API keys from env
    if (!apiKey) {
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

    if (!provider || !type || !payload?.prompt || !apiKey) {
      return json(
        {
          error:
            'Missing provider, API key, request type, or prompt (check env variables).',
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
    // This is a hard catch-all so Vercel never returns HTML
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
