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

    // Paginer pour récupérer TOUS les followers (jusqu'à 1000 max pour éviter timeout)
    do {
      const url = new URL("https://api.twitch.tv/helix/channels/followers");
      url.searchParams.set("broadcaster_id", BROADCASTER_ID);
      url.searchParams.set("first", "100");
      if (cursor) url.searchParams.set("after", cursor);

      const r = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}`, "Client-Id": CLIENT_ID },
      });

      if (!r.ok) return res.status(r.status).json(await r.json());

      const data = await r.json();
      all = all.concat(data.data || []);
      cursor = data.pagination?.cursor || null;

      // On s'arrête à 1000 pour éviter le timeout Vercel
    } while (cursor && all.length < 1000);

    // Les plus anciens en premier (followed_at croissant)
    all.sort((a, b) => new Date(a.followed_at) - new Date(b.followed_at));

    return res.status(200).json({ data: all.slice(0, 30), total: all.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}