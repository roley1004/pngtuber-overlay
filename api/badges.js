export default async function handler(req, res) {
  const { channel } = req.query;

  if (!channel) {
    return res.status(400).json({ error: 'Falta el nombre del canal' });
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Faltan credenciales de Twitch en Vercel' });
  }

  try {
    // 1. Pedimos permiso a Twitch
    const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, { method: 'POST' });
    const { access_token: accessToken } = await tokenRes.json();
    const headers = { 'Client-ID': clientId, 'Authorization': `Bearer ${accessToken}` };

    // 2. Buscamos el ID numérico del canal
    const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${channel}`, { headers });
    const userData = await userRes.json();
    
    if (!userData.data || userData.data.length === 0) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }
    const broadcasterId = userData.data[0].id;

    // 3. Descargamos las insignias Globales y las del Canal al mismo tiempo
    const [channelBadgesRes, globalBadgesRes] = await Promise.all([
      fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${broadcasterId}`, { headers }),
      fetch(`https://api.twitch.tv/helix/chat/badges/global`, { headers })
    ]);

    const channelBadges = await channelBadgesRes.json();
    const globalBadges = await globalBadgesRes.json();

    // 4. Unificamos todo en un diccionario limpio para tu chat
    const allBadges = {};

    if (globalBadges.data) {
      globalBadges.data.forEach(set => {
        allBadges[set.set_id] = {};
        set.versions.forEach(version => { allBadges[set.set_id][version.id] = version.image_url_1x; });
      });
    }

    if (channelBadges.data) {
      channelBadges.data.forEach(set => {
        if (!allBadges[set.set_id]) allBadges[set.set_id] = {};
        set.versions.forEach(version => { allBadges[set.set_id][version.id] = version.image_url_1x; });
      });
    }

    res.status(200).json({ success: true, badges: allBadges });

  } catch (error) {
    res.status(500).json({ error: 'Error al conectar con Twitch' });
  }
}