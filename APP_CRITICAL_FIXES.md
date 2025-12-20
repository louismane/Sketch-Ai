# Critical Fixes for App.tsx

## Issue
Initialization loop occurs when:
1. User enters Gemini API key
2. Goes to Studio and clicks "Initialize Session"
3. App shows "Synthesizing..."
4. Then bounces back to "Initialize" without completing

## Root Cause
- sessionFingerprint useEffect resets on every status change
- handleSynthesis can be called multiple times without guards
- No check to prevent re-initialization when already initialized
- Gemini API key verification fails and triggers cascading re-init calls

## Solutions Implemented

### 1. aiService.ts (COMPLETED)
- Now routes ALL requests through /api/proxy
- Proper error handling for Gemini keys
- Consistent provider handling

### 2. App.tsx - Required Changes

#### Fix 1: Add Guard to handleSynthesis (Around line 300)
REPLACE:
```typescript
const handleSynthesis = async () => {
  if (sessionInitialized) return;
```

WITH:
```typescript
const handleSynthesis = async () => {
  // CRITICAL: Guard against re-entry and already-initialized sessions
  if (sessionInitialized) {
    console.log('Session already initialized, skipping synthesis');
    return;
  }
  
  if (state.isProcessing) {
    console.log('Already processing, preventing duplicate request');
    return;
  }

  if (!state.user) {
    setState(p => ({ ...p, error: 'User session not found' }));
    return;
  }
```

#### Fix 2: Update useEffect for sessionFingerprint (Around line 235)
REPLACE:
```typescript
useEffect(() => {
  const saved = localStorage.getItem('sketchai_session_fp') || '';
  setSessionFingerprint(saved);
  if (saved && saved === computeFingerprint() && state.activeRoadmap) {
    setSessionInitialized(true);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

useEffect(() => {
  const current = computeFingerprint();
  if (sessionFingerprint && sessionFingerprint !== current) {
    setSessionInitialized(false);
    localStorage.removeItem('sketchai_session_fp');
    setSessionFingerprint('');
  }
}, [computeFingerprint, sessionFingerprint]);
```

WITH:
```typescript
useEffect(() => {
  const saved = localStorage.getItem('sketchai_session_fp') || '';
  setSessionFingerprint(saved);
  // Only auto-initialize if explicitly enabled AND we have a roadmap already loaded
  if (saved && state.activeRoadmap) {
    setSessionInitialized(true);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // ONLY run once on mount

useEffect(() => {
  const current = computeFingerprint();
  // Only reset if user explicitly changed provider/key, NOT on every render
  if (sessionFingerprint && sessionFingerprint !== current && state.view === 'studio') {
    // User switched providers - clear session only if they navigated away from workspace
    setSessionInitialized(false);
    localStorage.removeItem('sketchai_session_fp');
    setSessionFingerprint('');
  }
}, [computeFingerprint, state.view]); // Add state.view guard
```

#### Fix 3: Update handleTestConnection (Around line 380)
Replace the entire function to use /api/proxy:
```typescript
const handleTestConnection = async (provider: string) => {
  const key = state.user?.apiKeys[provider];
  
  if (!key || key.trim() === '') {
    alert(`Please enter a ${provider} key first.`);
    return;
  }

  const btn = document.getElementById('btn-' + provider);
  if (!btn) return;

  btn.innerText = "Testing...";
  btn.style.color = "#94a3b8";

  try {
    // Use /api/proxy for ALL providers consistently
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: provider,
        type: 'text',
        apiKey: key,
        payload: { prompt: 'test connection' }
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || `${provider} verification failed`);
    }

    btn.innerText = "Verified ✓";
    btn.style.color = "#4ade80";
    
    setTimeout(() => {
      btn.innerText = "Test";
      btn.style.color = "";
    }, 3000);

  } catch (err: any) {
    btn.innerText = "Failed ✗";
    btn.style.color = "#ef4444";
    console.error(`${provider} test error:`, err);
    
    setTimeout(() => {
      btn.innerText = "Test";
      btn.style.color = "";
    }, 3000);
  }
};
```

## Testing Steps

1. Clear localStorage: Open DevTools Console and run `localStorage.clear()`
2. Signup with test account (e.g., testuser / test123)
3. Go to Profile → Vault
4. Enter Gemini API key: `AIzaSyBDttRjBwHwXFJOJLzTYeArc__c_tvzgA4`
5. Click "Test" button - should show "Verified ✓" (NOT loop)
6. Go to Studio → Select "Asset Scan" mode
7. Click "Initialize Session" - should show "Synthesizing..." once, then "Session Ready"
8. NOT bounce back to "Initialize"
9. Check DevTools Console - should see no repeated error logs

## Expected Behavior After Fixes
- Initialize button clicked → "Synthesizing" displays once
- After ~5-10 seconds → "Session Ready" state
- No looping back to Initialize button
- Clean console with no repeated errors
- Gemini key test shows Verified checkmark

## Deployment
Once these changes are applied:
1. Push to GitHub
2. Vercel auto-deploys
3. Test at: https://sketch-ai-woad.vercel.app/
