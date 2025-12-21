import { AIProvider, ArtMedium, ArtRoadmap, SkillLevel } from "../types";

export interface AIServiceResponse {
  roadmap?: ArtRoadmap;
  image?: string;
  error?: string;
}

export class AIService {
  /**
   * Generate a detailed art instruction roadmap for the user,
   * based on skill level, medium, and input image data.
   */
  static async generateRoadmap(
    userId: string,
    imageData: string,
    medium: ArtMedium,
    skill: SkillLevel,
    provider: AIProvider,
    apiKeys: Record<string, string>
  ): Promise<ArtRoadmap> {
    const apiKey = apiKeys[provider] || '';
    if (!apiKey) {
      throw new Error(`No API key found for provider "${provider}". Please add one in Settings.`);
    }

    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        type: 'roadmap',
        apiKey,
        payload: {
          // Only send prompt text; keep large data local to prevent 413.
          prompt: `Create a detailed art instruction roadmap for a ${skill} artist learning ${medium}. The subject reference is stored locally in the browser (not uploaded).`
        }
      })
    });

    // Read as text and safely parse to avoid Unexpected token JSON errors
    const raw1 = await response.text();
    let data: any = {};
    try { data = raw1 ? JSON.parse(raw1) : {}; } catch { data = { error: 'Invalid JSON response from proxy', raw: raw1 }; }

    if (!response.ok || data.error) {
      throw new Error(data.error ?? `${provider} roadmap generation failed`);
    }

    // Try to parse roadmap JSON from response.result
    try {
      return JSON.parse(data.result);
    } catch (error) {
      // If parsing fails, return a fallback empty roadmap with minimal info
      return {
        id: userId,
        medium,
        skillLevel: skill,
        steps: [],
        createdAt: new Date().toISOString(),
      } as ArtRoadmap;
    }
  }

  /**
   * Generate an image based on the given prompt using specified AI provider.
   */
  static async imagineImage(
    prompt: string,
    provider: AIProvider,
    apiKeys: Record<string, string>
  ): Promise<string> {
    const apiKey = apiKeys[provider] || '';
    if (!apiKey) {
      throw new Error(`No API key found for provider "${provider}". Please add one in Settings.`);
    }

    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        type: 'image',
        apiKey,
        payload: { prompt }
      })
    });

    const raw2 = await response.text();
    let data: any = {};
    try { data = raw2 ? JSON.parse(raw2) : {}; } catch { data = { error: 'Invalid JSON response from proxy', raw: raw2 }; }

    if (!response.ok || data.error) {
      throw new Error(data.error ?? `${provider} image generation failed`);
    }

    return data.result;
  }
}
