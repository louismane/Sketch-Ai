# Atelier Art Assistant (Apex v10.0)

**The Precision Visual Deconstruction Engine.**

SketchAI "Apex" is a provider-agnostic, professional-grade art education platform. It deconstructs complex visual concepts into progressive, medium-specific drawing guides using advanced AI orchestration.

---

## 🏛️ Apex v10.0 Architecture

### 🛡️ System-Level Biometric Security
The "Digital Vault" now utilizes **System Verification** (Windows Hello, Touch ID, Face ID) via the WebAuthn standard (`navigator.credentials.get`).
- **Zero-Knowledge**: Your API keys are encrypted locally (AES/XOR hybrid) and never leave your device unencrypted.
- **Platform-Owned**: We do not process your biometrics. Your OS confirms your identity, and the app simply unlocks the local vault.
- **Session Persistence**: Validated sessions persist securely without constant re-authentication loops.

### 🌐 Multi-Provider Matrix
The new "Apex" Proxy routes synthesis requests to **12+ AI Engines**:
- **Core**: OpenAI (GPT-4), Gemini (1.5 Pro), Stability AI (SDXL).
- **Expanded**: Hugging Face (Mistral), DeepAI, Replicate, NanoBanana.
- **Smart Detection**: The "Manifest Engine" automatically switches providers based on your prompt (e.g., typing "midjourney style" switches context).

### 🎨 30+ High-Fidelity Mediums
Each medium triggers a unique pedagogical model with specific technical constraints:
- **Traditional**: Graphite, Charcoal, Oil Paint, Watercolor, Gouache, Crayon.
- **Ink**: Ballpoint, Fountain Pen, Technical Pen (Isograph), Ink Wash.
- **Digital**: Pixel Art, Vector Art, Airbrush, Digital Painting.
- **Technical**: Perspective Study, Construction lines, Anatomy.

---

## 🚀 Deployment

### Live Application
[SketchAI Professional Atelier](https://louismane.github.io/Sketch-Ai/)

### Development Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/louismane/Sketch-Ai.git
   cd Sketch-Ai
   npm install
   ```

2. **Environment (Optional)**
   Create a `.env.local` file for default "Free Tier" keys (not recommended for production).
   ```env
   VITE_OPENAI_API_KEY=sk-...
   ```

3. **Run Local Studio**
   ```bash
   npm run dev
   ```

4. **Production Build**
   ```bash
   npm run build
   # Outputs to /dist with relative paths for GitHub Pages/Vercel support.
   ```

---

## 🔐 The Vault (Key Management)
Access your profile to verify connection status.
- **Status Indicators**:
  - 🟢 **Verified**: Key is active and responding.
  - 🔴 **Failed**: Key is invalid or quota exceeded.
  - 🟡 **Testing**: Connection probe in progress.

---

© 2024-2025 Antigravity Engineering. All Rights Reserved.
