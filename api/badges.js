export default async function handler(req, res) {
  let { channel } = req.query;

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const missing = [];
    if (!clientId) missing.push("TWITCH_CLIENT_ID");
    if (!clientSecret) missing.push("TWITCH_CLIENT_SECRET");
    return res.status(500).json({ 
      error: `Faltan credenciales: ${missing.join(', ')}. Revisa Vercel o tu archivo .env local.` 
    });
  }

  try {
    // Normalizamos el canal a minúsculas exactas para la API de Twitch
    if (channel) channel = channel.replace('#', '').trim().toLowerCase();

    const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, { method: 'POST' });
    const { access_token: accessToken } = await tokenRes.json();
    const headers = { 'Client-ID': clientId, 'Authorization': `Bearer ${accessToken}` };

    const globalBadgesRes = await fetch(`https://api.twitch.tv/helix/chat/badges/global`, { headers });
    const globalBadges = await globalBadgesRes.json();
    
    const allBadges = {};

    if (globalBadges.data) {
      globalBadges.data.forEach(set => {
        allBadges[set.set_id] = {};
        set.versions.forEach(version => { 
            allBadges[set.set_id][version.id] = version.image_url_4x || version.image_url_2x || version.image_url_1x; 
        });
      });
    }

    if (channel) {
      const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${channel}`, { headers });
      const userData = await userRes.json();
      
      if (userData.data && userData.data.length > 0) {
        const broadcasterId = userData.data[0].id;
        
        const channelBadgesRes = await fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${broadcasterId}`, { headers });
        const channelBadges = await channelBadgesRes.json();

        if (channelBadges.data) {
          channelBadges.data.forEach(set => {
            if (!allBadges[set.set_id]) allBadges[set.set_id] = {};
            // Reemplazamos las insignias globales por las personalizadas del canal
            set.versions.forEach(version => { 
                allBadges[set.set_id][version.id] = version.image_url_4x || version.image_url_2x || version.image_url_1x; 
            });
          });
        }
      }
    }

    res.status(200).json({ success: true, badges: allBadges });
  } catch (error) {
    res.status(500).json({ error: 'Error al conectar con Twitch' });
  }
}