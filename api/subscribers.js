const BROADCASTER_ID = "441069979";
const CLIENT_ID      = "mk16oce917g7q5i485zlyackq33ce0";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const token = process.env.BROADCASTER_TOKEN;
  if (!token) return res.status(500).json({ error: "Broadcaster token non configuré" });

  try {
    // 1. Récupère tous les subs
    let subs = [];
    let cursor = null;
    do {
      const url = new URL("https://api.twitch.tv/helix/subscriptions");
      url.searchParams.set("broadcaster_id", BROADCASTER_ID);
      url.searchParams.set("first", "100");
      if (cursor) url.searchParams.set("after", cursor);
      const r = await fetch(url, { headers: { "Authorization": `Bearer ${token}`, "Client-Id": CLIENT_ID } });
      if (!r.ok) return res.status(r.status).json(await r.json());
      const data = await r.json();
      subs = subs.concat((data.data || []).filter(s => s.user_id !== BROADCASTER_ID));
      cursor = data.pagination?.cursor || null;
    } while (cursor && subs.length < 1000);

    // 2. Pour chaque sub, récupère la date de follow
    const userIds = subs.map(s => s.user_id);
    const followMap = {};

    // Batch par 100 (limite API)
    for (let i = 0; i < userIds.length; i += 100) {
      const batch = userIds.slice(i, i + 100);
      const url = new URL("https://api.twitch.tv/helix/channels/followers");
      url.searchParams.set("broadcaster_id", BROADCASTER_ID);
      url.searchParams.set("first", "100");
      batch.forEach(id => url.searchParams.append("user_id", id));
      const r = await fetch(url, { headers: { "Authorization": `Bearer ${token}`, "Client-Id": CLIENT_ID } });
      if (r.ok) {
        const data = await r.json();
        (data.data || []).forEach(f => { followMap[f.user_id] = f.followed_at; });
      }
    }

    // 3. Tri : Tier décroissant, puis date de follow croissante (plus ancien = meilleur)
    subs.sort((a, b) => {
      const tierDiff = Number(b.tier) - Number(a.tier);
      if (tierDiff !== 0) return tierDiff;
      const aFollow = followMap[a.user_id] ? new Date(followMap[a.user_id]) : new Date();
      const bFollow = followMap[b.user_id] ? new Date(followMap[b.user_id]) : new Date();
      return aFollow - bFollow; // plus ancien en premier
    });

    const result = subs.slice(0, 20).map(s => ({
      user_id:     s.user_id,
      user_name:   s.user_name,
      tier:        s.tier,
      is_gift:     s.is_gift,
      gifter_name: s.gifter_name,
      followed_at: followMap[s.user_id] || null,
    }));

    return res.status(200).json({ data: result });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}