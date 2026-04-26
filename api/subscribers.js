const BROADCASTER_ID = "441069979";
const CLIENT_ID      = "mk16oce917g7q5i485zlyackq33ce0";

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
        headers: { "Authorization": `Bearer ${token}`, "Client-Id": CLIENT_ID },
      });

      if (!r.ok) return res.status(r.status).json(await r.json());

      const data = await r.json();
      const filtered = (data.data || []).filter(s => s.user_id !== BROADCASTER_ID);
      all = all.concat(filtered);
      cursor = data.pagination?.cursor || null;

    } while (cursor && all.length < 1000);

    // Trier par ancienneté : on utilise l'ordre retourné par Twitch
    // qui est chronologique (les plus anciens subs arrivent en premier dans la pagination)
    // On inverse donc pour avoir les plus anciens en tête
    // Note: Twitch ne fournit pas de date de sub, on utilise l'ordre de pagination
    // Les premiers dans la liste paginée sont les plus récents, donc on inverse
    all.reverse();

    return res.status(200).json({ data: all.slice(0, 30), total: all.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}