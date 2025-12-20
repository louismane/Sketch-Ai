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
  [ArtMedium.COLORED_PENCIL]: "Focus on layering, burnishing (heavy pressure), solvent blending, and color theory (complementary underpainting).",
  [ArtMedium.CHARCOAL]: "Focus on subtractive drawing with kneaded erasers, vine vs compressed charcoal, and broad tonal masses. Mention fixative.",
  [ArtMedium.WATERCOLOR]: "Focus on wet-on-wet vs wet-on-dry techniques, transparency, glazing, blooms, and preserving the white of the paper.",
  [ArtMedium.SOFT_PASTEL]: "Focus on scumbling, feathering, layering light over dark, and the fragile nature of pigment layers.",
  [ArtMedium.OIL_PASTEL]: "Focus on heavy application, sgraffito, and blending with solvents (turpentine) or fingers for a painterly effect.",
  [ArtMedium.BLUE_INK]: "Focus on line weight, cross-hatching, stippling, and the permanence of marks. Mention ballpoint mechanics versus fountain pen.",
  [ArtMedium.BLACK_INK]: "Focus on high contrast, spotting blacks, texture through stippling/hatching, and varying nib sizes.",
  [ArtMedium.ALCOHOL_MARKER]: "Focus on rapid application, blending while wet, streak-free coloring, and using a colorless blender for soft edges.",
  [ArtMedium.OIL_PAINT]: "Focus on 'fat over lean' principles, impasto, glazing, and slow drying times. Mention linseed oil and turpentine/mineral spirits.",
  [ArtMedium.DIGITAL_PAINTING]: "Focus on layer management, opacity settings, blending modes (Multiply, Overlay), and custom brush dynamics.",
  [ArtMedium.DIGITAL_SKETCH]: "Focus on quick, iterative strokes, pressure-sensitive tablet dynamics, and rough conceptual block-ins.",
  [ArtMedium.ACRYLIC]: "Focus on rapid drying times, opacity, scumbling, and using retarders or flow improvers to extend workability.",
  [ArtMedium.GOUACHE]: "Focus on the opaque, matte finish, reactivating dry paint with water, and layering light over dark.",
  [ArtMedium.BALLPOINT_PEN]: "Focus on controlled pressure for shading (lighter pressure = lighter line), cross-hatching, and ink accumulation.",
  [ArtMedium.FOUNTAIN_PEN]: "Focus on nib flexibility, line variation (thin up, thick down), and managing ink flow on different paper types.",
  [ArtMedium.TECHNICAL_PEN]: "Focus on uniform line weights (isograph/rapidograph), precision, geometric construction, and clean stippling.",
  [ArtMedium.MECHANICAL_PENCIL]: "Focus on consistent line width, precision drafting, and fine detail without the need for sharpening.",
  [ArtMedium.CHALK]: "Focus on broad, dusty strokes, blending on toned paper, and using the paper color as a mid-tone.",
  [ArtMedium.WATER_BASED_MARKER]: "Focus on watercolor-like effects, avoiding paper pilling, and using water to soften edges.",
  [ArtMedium.VECTOR_ART]: "Focus on anchor points, bezier curves, clean boolean operations, and scalable geometric shapes.",
  [ArtMedium.PIXEL_ART]: "Focus on limited palettes, dither patterns, anti-aliasing (or lack thereof), and sprite readability.",
  [ArtMedium.CARTOON]: "Focus on exaggeration, squash and stretch, simplified anatomy, and expressive line of action.",
  [ArtMedium.ANIME_MANGA]: "Focus on screentones, speed lines, distinct facial proportions, and ink-like line quality.",
  [ArtMedium.GESTURE_STUDY]: "Focus on the 'line of action', rhythmic flow, capturing energy in seconds, and ignoring detail.",
  [ArtMedium.CONSTRUCTION_STUDY]: "Focus on breaking complex forms into primitive solids (spheres, cubes, cylinders) and perspective.",
  [ArtMedium.PERSPECTIVE_STUDY]: "Focus on horizon lines, vanishing points (1pt, 2pt, 3pt), and foreshortening logic.",
  [ArtMedium.VALUE_STUDY]: "Focus on the 5-tone scale (highlight, midtone, core shadow, reflected light, cast shadow) grouping.",
  [ArtMedium.LIGHTING_STUDY]: "Focus on light sources, rim light, subsurface scattering, and occlusion shadows.",
  [ArtMedium.COMIC_BOOK]: "Focus on sequential storytelling, dynamic composition, panel layout, and dramatic spotting of blacks.",
  [ArtMedium.STORYBOARD]: "Focus on camera angles, continuity, clear blocking, and arrows indicating movement.",
  [ArtMedium.CONCEPT_ART]: "Focus on silhouette readability, functional design, material indication, and mood/atmosphere.",
  [ArtMedium.CHARACTER_DESIGN]: "Focus on shape language (circle, square, triangle), costume hierarchy, and turnaround views.",
  [ArtMedium.ILLUSTRATION]: "Focus on composition, focal points, narrative elements, and highly polished rendering.",
  [ArtMedium.REALISM]: "Focus on proportional accuracy, subtle value transitions, texture mapping, and observational fidelity.",
  [ArtMedium.IMPRESSIONISM]: "Focus on light quality, visible brushstrokes, color temperature validation, and optical blending.",
  [ArtMedium.AIRBRUSH]: "Focus on smooth gradients, masking/friskets, soft edges, and controlling paint flow/air pressure.",
  [ArtMedium.CRAYON]: "Focus on wax resist techniques, texture buildup, sgraffito (scratching out), and bold color blocking.",
  [ArtMedium.INK_WASH]: "Focus on controlling water-to-ink ratios, creating gradients, and managing edge hardness (wet-on-wet vs dry).",
  [ArtMedium.MIXED_MEDIA]: "Focus on combining materials effectively (e.g., watercolor base with ink details), and substrate compatibility.",
  [ArtMedium.SKETCH_PEN]: "Focus on looseness, varying line speed, and capturing the essence of the subject quickly.",
  [ArtMedium.BRUSH_PEN]: "Focus on dynamic line weight changes, calligraphy-like strokes, and organic texture.",
};

/**
 * AI Proxy Service Layer
 * 
 * Centralized service for orchestrating secure communication with the backend proxy.
 * Ensures that no API keys are ever exposed to client-side logic beyond the encrypted vault.
 * Routes all synthesis requests (Task 66) to /api/proxy with strictly typed payloads.
 */
export class APIManager {
  // Alias for clearer semantics in newer components
  static get Service() {
    return APIManager;
  }

  /**
   * Unified client-side entry point that communicates with the secure /api/proxy.
   * Routes educational roadmap requests to the active AI provider.
   */
  static async generateRoadmap(
    provider: AIProvider,
    request: AIRequest,
    apiKey: string
  ): Promise<ArtRoadmap> {
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
          visualType: APIManager.inferVisualType(i, data.steps.length),
        })),
        images: {},
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
          payload: { prompt: `Artist deconstruction for: ${prompt}. Professional conceptual sketch style suitable for ${provider}.` },
        }),
      });

      if (!response.ok) throw new Error("Synthesis failed.");

      const { result } = await response.json();
      return result;
    } catch (err) {
      console.warn("Synthesis interrupted, falling back to prompt interpretation:", err);
      return prompt;
    }
  }

  private static inferVisualType(index: number, total: number): string {
    const types = ['gesture', 'shapes', 'outline', 'detail', 'shading', 'final'];
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
