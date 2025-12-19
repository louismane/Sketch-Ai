# Atelier Art Assistant: Universal Drawing Engine

A professional, provider-agnostic art deconstruction platform. Support for OpenAI, Gemini, Stability AI, and more.

## 🚀 Deployment Instructions

### 1. Vercel / Netlify (Recommended)
This project is optimized for **Vercel Edge Functions**.

1. Connect your GitHub repository to Vercel.
2. Set the following **Environment Variables** (Optional defaults):
   - `OPENAI_API_KEY`
   - `GEMINI_API_KEY`
   - `STABILITY_AI_API_KEY`
   - `HUGEFACE_API_KEY`
3. Deploy!

### 2. Local Development
1. `npm install`
2. `npm run dev`
3. Access "The Vault" in your profile to add your personal API keys.

## 🛠 Features

- **Smart Proxy Hub**: Secure routing to multiple AI providers without exposing keys.
- **The Digital Vault**: Secure, client-side management for all your AI credentials, protected by a **Biometric Identity Guard**.
- **Art Registry (Gallery)**: Full persistent history of your artistic deconstructions with restoration capabilities.
- **Medium-Specific Logic**: Professional pedagogical instructions for Graphite, Watercolor, Oil Paint, and dozens of other styles.
- **Imagination Manifestation**: Generate structured drawing guides from poems, descriptions, or complex conceptual prompts.

## 🛡 Security
API keys entered in the application are stored in your browser's `localStorage` and sent over HTTPS to a secure Edge Function proxy. No keys are ever stored on a centralized database.
