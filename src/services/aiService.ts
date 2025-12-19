import { AIProvider, ArtMedium, ArtRoadmap, SkillLevel } from "../types";
import { APIManager } from "./apiManager";

export interface AIServiceResponse {
    roadmap?: ArtRoadmap;
    image?: string;
    error?: string;
}

export class AIService {
    static async generateRoadmap(
        userId: string,
        imageData: string,
        medium: ArtMedium,
        skill: SkillLevel,
        provider: AIProvider,
        apiKeys: Record<string, string>
    ): Promise<ArtRoadmap> {
        // Extract the specific key for the requested provider
        const apiKey = apiKeys[provider] || '';
        if (!apiKey) console.warn(`No API key found for ${provider}, proceeding with potential falback/error.`);

        return await APIManager.generateRoadmap(provider, {
            image: imageData,
            medium,
            skill,
            userId
        }, apiKey);
    }

    static async imagineImage(
        prompt: string,
        provider: AIProvider,
        apiKeys: Record<string, string>
    ): Promise<string> {
        const apiKey = apiKeys[provider] || '';
        return await APIManager.imagineImage(provider, prompt, apiKey);
    }
}
