import { AIProvider, ArtMedium, SkillLevel, ArtRoadmap } from "../types";

export interface AIRequest {
    prompt?: string;
    image?: string;
    medium: ArtMedium;
    skill: SkillLevel;
    userId: string;
}

const MEDIUM_CONSTRAINTS: Record<string, string> = {
    [ArtMedium.GRAPHITE]: "Focus on pencil grades (H to B), hatching, cross-hatching, and blending stump usage. Emphasize value scales.",
    [ArtMedium.COLORED_PENCIL]: "Focus on layering, burnishing, and color theory. Instructions should mention light pressure for base layers.",
    [ArtMedium.CHARCOAL]: "Focus on subtractive drawing with kneaded erasers, vine vs compressed charcoal, and broad tonal masses.",
    [ArtMedium.WATERCOLOR]: "Focus on wet-on-wet vs wet-on-dry techniques, transparency, blooms, and preserving the white of the paper.",
    [ArtMedium.SOFT_PASTEL]: "Focus on scumbling, feathering, and the fragile nature of pigment layers. Use fixative tips.",
    [ArtMedium.OIL_PASTEL]: "Focus on heavy application, sgraffito, and blending with solvents or fingers.",
    [ArtMedium.BLUE_INK]: "Focus on line weight, cross-hatching, and the permanence of marks. Mention ballpoint vs fountain pen techniques.",
    [ArtMedium.BLACK_INK]: "Focus on high contrast, stippling, and varying nib sizes for technical precision.",
    [ArtMedium.ALCOHOL_MARKER]: "Focus on blending with alcohol-based markers, streak-free applications, and using a colorless blender.",
    [ArtMedium.OIL_PAINT]: "Focus on 'fat over lean' principles, impasto, glazing, and slow drying times. Mention linseed oil and turpentine.",
    [ArtMedium.DIGITAL_PAINTING]: "Focus on layers, opacity settings, specialized brush engine dynamics, and non-destructive editing.",
    [ArtMedium.ACRYLIC]: "Focus on rapid drying times, opacity, scumbling, and using mediums to extend workability.",
    [ArtMedium.GOUACHE]: "Focus on flat color blocks, layering light over dark, and its unique matte finish.",
    [ArtMedium.BALLPOINT_PEN]: "Focus on pressure sensitivity for smooth gradients and fine detail consistency.",
    [ArtMedium.FOUNTAIN_PEN]: "Focus on ink flow, nib flexibility, and the expressive nature of varying line weights.",
    [ArtMedium.TECHNICAL_PEN]: "Focus on uniform line weights, precise geometric rendering, and stippling for tonal depth.",
};

export class APIManager {
    /**
     * Unified client-side entry point that communicates with the secure /api/proxy.
     */
    static async generateRoadmap(provider: AIProvider, request: AIRequest, apiKey: string): Promise<ArtRoadmap> {
        if (!apiKey) throw new Error(`${provider} API key required. Update your profile settings.`);

        const technicalGuidance = MEDIUM_CONSTRAINTS[request.medium] || "Focus on structural anatomy and core techniques of this medium.";

        const systemPrompt = `You are a world-class art instructor specializing in ${request.medium}.
TASK: Create a professional, step-by-step deconstruction for a ${request.skill} level artist.
SUBJECT: ${request.image || request.prompt}
MEDIUM: ${request.medium}
TECHNICAL CONSTRAINTS: ${technicalGuidance}

REQUIRED JSON FORMAT:
{
  "materials": ["specific high-quality tools for ${request.medium}"],
  "steps": [
    { 
      "title": "Technical Phase Title", 
      "instruction": "Pedagogical directions focusing on ${request.medium} techniques. Be human-like and encouraging.", 
      "technicalTip": "Professional advice on avoiding common mistakes or achieving specific textures.", 
      "toolsNeeded": ["specific ${request.medium} pencils/brushes/pens"] 
    }
  ]
}

SPECIFICATIONS:
- Generate 6 to 10 progressive steps.
- Ensure instructions use terminology unique to ${request.medium}.
- The deconstruction must be structurally sound and educational.
- Return ONLY valid JSON. Avoid any text outside the JSON block.`;

        try {
            const response = await fetch('/api/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    apiKey,
                    type: 'roadmap',
                    payload: { prompt: systemPrompt }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to communicate with the drawing engine.");
            }

            const { result } = await response.json();

            // Extract JSON from result text
            const jsonText = result.match(/\{[\s\S]*\}/)?.[0] || result;
            const data = JSON.parse(jsonText);

            return {
                id: crypto.randomUUID(),
                userId: request.userId,
                medium: request.medium,
                skill: request.skill,
                timestamp: Date.now(),
                materials: data.materials,
                steps: data.steps.map((s: any, i: number) => ({
                    id: i + 1,
                    ...s,
                    visualType: APIManager.inferVisualType(i, data.steps.length)
                })),
                images: {}
            };
        } catch (error: any) {
            console.error("APIManager Error:", error);
            throw new Error(`Engine failure: ${error.message}. Please verify your ${provider} credentials.`);
        }
    }

    /**
     * Unified method for image synthesis via the backend proxy.
     */
    static async imagineImage(provider: AIProvider, prompt: string, apiKey: string): Promise<string> {
        if (!apiKey) return prompt;

        try {
            const response = await fetch('/api/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    apiKey,
                    type: 'image',
                    payload: { prompt: `Artist deconstruction for: ${prompt}. Professional conceptual sketch style suitable for ${provider}.` }
                })
            });

            if (!response.ok) throw new Error("Synthesis failed.");

            const { result } = await response.json();
            return result;
        } catch (err) {
            console.warn("Synthesis interrupted, falling back to prompt interpretation:", err);
            return prompt;
        }
    }

    private static inferVisualType(index: number, total: number): any {
        const types: any[] = ['gesture', 'shapes', 'outline', 'detail', 'shading', 'final'];
        if (total <= 6) return types[index] || 'final';

        if (index === 0) return 'gesture';
        if (index === total - 1) return 'final';
        const progress = index / total;
        if (progress < 0.2) return 'shapes';
        if (progress < 0.4) return 'outline';
        if (progress < 0.7) return 'detail';
        return 'shading';
    }
}
