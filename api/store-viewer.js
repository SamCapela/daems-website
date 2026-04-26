import { kv } from "@vercel/kv";

const CLIENT_ID = "mk16oce917g7q5i485zlyackq33ce0";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { token, user_id, display_name, sub_months, is_sub } = req.body;
  if (!token || !user_id) return res.status(400).json({ error: "Manque token ou user_id" });

  // Vérifie le token
  const r = await fetch("https://id.twitch.tv/oauth2/validate", {
    headers: { "Authorization": `OAuth ${token}` }
  });
  const validated = await r.json();
  if (validated.user_id !== user_id) return res.status(403).json({ error: "Token invalide" });

  // Stocke les données du viewer
  await kv.hset(`viewer:${user_id}`, {
    display_name,
    sub_months: sub_months || 0,
    is_sub: is_sub || false,
    updated_at: Date.now(),
  });

  // Si sub, ajoute à l'index des subs pour le leaderboard
  if (is_sub && sub_months > 0) {
    await kv.zadd("leaderboard:sub_months", { score: sub_months, member: user_id });
  }

  return res.status(200).json({ ok: true });
}