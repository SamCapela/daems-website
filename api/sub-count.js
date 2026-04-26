const BROADCASTER_ID = "441069979";
const CLIENT_ID      = "mk16oce917g7q5i485zlyackq33ce0";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const token = process.env.BROADCASTER_TOKEN;
  if (!token) return res.status(500).json({ error: "Broadcaster token non configuré" });

  try {
    const url = new URL("https://api.twitch.tv/helix/subscriptions");
    url.searchParams.set("broadcaster_id", BROADCASTER_ID);
    url.searchParams.set("first", "1");
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "Client-Id": CLIENT_ID } });
    if (!r.ok) return res.status(r.status).json(await r.json());
    const data = await r.json();
    return res.status(200).json({ total: data.total ?? null });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
