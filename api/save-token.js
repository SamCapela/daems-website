// Cette route affiche le token du broadcaster pour qu'on puisse le copier
// dans les variables d'environnement Vercel - protégée par un secret
export default async function handler(req, res) {
  const { token, secret } = req.query;

  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "Accès refusé" });
  }

  if (!token) {
    return res.status(400).json({ error: "Token manquant" });
  }

  // Vérifier que c'est bien le token de Daems_
  const r = await fetch("https://api.twitch.tv/helix/users", {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Client-Id": "mk16oce917g7q5i485zlyackq33ce0",
    },
  });

  const data = await r.json();
  const user = data.data?.[0];

  if (user?.login?.toLowerCase() !== "daems_") {
    return res.status(403).json({ error: `Mauvais compte : ${user?.login}` });
  }

  return res.status(200).json({
    message: "✅ Token valide ! Copie ce token dans BROADCASTER_TOKEN sur Vercel.",
    login: user.login,
    token: token,
  });
}