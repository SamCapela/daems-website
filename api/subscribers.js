const BROADCASTER_ID = "441069979";
const CLIENT_ID = "mk16oce917g7q5i485zlyackq33ce0";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const token = process.env.BROADCASTER_TOKEN;
  if (!token) return res.status(500).json({ error: "Broadcaster token non configuré" });

  try {
    let all = [];
    let cursor = null;

    do {
      const url = new URL("https://api.twitch.tv/helix/subscriptions");
      url.searchParams.set("broadcaster_id", BROADCASTER_ID);
      url.searchParams.set("first", "100");
      if (cursor) url.searchParams.set("after", cursor);

      const r = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Client-Id": CLIENT_ID,
        },
      });

      if (!r.ok) {
        const err = await r.json();
        return res.status(r.status).json(err);
      }

      const data = await r.json();
      // Exclure le broadcaster lui-même
      const filtered = (data.data || []).filter(s => s.user_id !== BROADCASTER_ID);
      all = all.concat(filtered);
      cursor = data.pagination?.cursor || null;
    } while (cursor && all.length < 100);

    // Trier par tier décroissant
    all.sort((a, b) => Number(b.tier) - Number(a.tier));

    return res.status(200).json({ data: all.slice(0, 30), total: all.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}