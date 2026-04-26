const BROADCASTER_ID = "441069979";
const CLIENT_ID      = "mk16oce917g7q5i485zlyackq33ce0";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const token = process.env.BROADCASTER_TOKEN;
  if (!token) return res.status(500).json({ error: "Broadcaster token non configuré", data: [] });

  try {
    const headers = {
      "Authorization": `Bearer ${token}`,
      "Client-Id": CLIENT_ID,
    };

    // ── Derniers subs ──────────────────────────────────────────────────────
    const subsRes = await fetch(
      `https://api.twitch.tv/helix/subscriptions?broadcaster_id=${BROADCASTER_ID}&first=20`,
      { headers }
    );
    const subsData = subsRes.ok ? await subsRes.json() : { data: [] };
    const subs = (subsData.data || [])
      .filter(s => s.user_id !== BROADCASTER_ID)
      .map(s => ({
        type:  s.is_gift ? "subgift" : "sub",
        name:  s.is_gift ? s.gifter_name || "Anonyme" : s.user_name,
        target: s.is_gift ? s.user_name : null,
        label: s.is_gift
          ? `offre un sub à ${s.user_name}`
          : `Tier ${s.tier?.[0] || 1}`,
        icon:  s.is_gift ? "🎁" : "⭐",
        tier:  s.tier,
      }));

    // ── Top Cheers (bits) des 7 derniers jours ─────────────────────────────
    const now   = new Date();
    const week  = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const cheersRes = await fetch(
      `https://api.twitch.tv/helix/bits/leaderboard?broadcaster_id=${BROADCASTER_ID}&count=10&period=week&started_at=${week.toISOString()}`,
      { headers }
    );
    const cheersData = cheersRes.ok ? await cheersRes.json() : { data: [] };
    const cheers = (cheersData.data || []).map(c => ({
      type:  "cheer",
      name:  c.user_name,
      label: `${c.score.toLocaleString("fr-FR")} bits cette semaine`,
      icon:  "💜",
    }));

    // ── Mélange et shuffle ─────────────────────────────────────────────────
    const all = [...subs, ...cheers].sort(() => Math.random() - 0.5);

    return res.status(200).json({ data: all });
  } catch (e) {
    return res.status(500).json({ error: e.message, data: [] });
  }
}