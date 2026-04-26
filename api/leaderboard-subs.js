import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  try {
    // Top 20 par mois de sub décroissant
    const top = await kv.zrange("leaderboard:sub_months", 0, 19, {
      rev: true,
      withScores: true,
    });

    if (!top || top.length === 0) return res.status(200).json({ data: [] });

    // top = [user_id, score, user_id, score, ...]
    const results = [];
    for (let i = 0; i < top.length; i += 2) {
      const user_id   = top[i];
      const sub_months = top[i + 1];
      const viewer = await kv.hgetall(`viewer:${user_id}`);
      if (viewer) {
        results.push({
          user_id,
          display_name: viewer.display_name,
          sub_months: parseInt(sub_months),
          is_sub: viewer.is_sub,
        });
      }
    }

    return res.status(200).json({ data: results });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}