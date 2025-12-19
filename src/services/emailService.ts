
/**
 * PRODUCTION EMAIL SERVICE (Resend.com / Brevo Integration)
 * Instructions for Setup:
 * 1. Register for a free account at Resend.com.
 * 2. Add your RESEND_API_KEY to your environment variables.
 * 3. Verified domains ensure 0% spam rate.
 */

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const apiKey = typeof process !== 'undefined' ? process.env.RESEND_API_KEY : '';
  
  if (!apiKey || apiKey === "" || apiKey === "undefined") {
    console.warn("RESEND_API_KEY not found. Reset Link (Simulation):", resetLink);
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'SketchAI Studio <atelier@resend.dev>',
        to,
        subject: 'SketchAI: Password Study Reset',
        html: `
          <div style="font-family: serif; color: #0f1115; padding: 20px;">
            <h1 style="color: #d97706;">Your Studio Access</h1>
            <p>A password reset study was requested for your SketchAI account.</p>
            <p><a href="${resetLink}" style="background: #d97706; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Reset My Password</a></p>
            <p>If you didn't request this, your easel is safe. Just ignore this message.</p>
            <p><em>"Take your time on this step before moving on."</em></p>
          </div>
        `
      })
    });

    return res.ok;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}
