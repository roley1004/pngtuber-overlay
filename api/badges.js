export default async function handler(req, res) {
  let { channel } = req.query;

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  // Catálogo de reserva para garantizar visualización en vista previa o si faltan credenciales
  const defaultFallbackBadges = {
    broadcaster: { "1": "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/3" },
    moderator: { "1": "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3" },
    vip: { "1": "https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/3" },
    subscriber: { "0": "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/3", "1": "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/3" },
    turbo: { "1": "https://static-cdn.jtvnw.net/badges/v1/bd444ec6-8f34-4bf9-91f4-af1e3428d80f/3" },
    premium: { "1": "https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/3" },
    bits: { "1000": "https://static-cdn.jtvnw.net/badges/v1/0d85a29e-79ad-4c63-a285-3acd2c66f2ba/3" }
  };

  if (!clientId || !clientSecret) {
    return res.status(200).json({ 
      success: true, 
      badges: defaultFallbackBadges, 
      warning: "Faltan credenciales en el entorno Preview; usando insignias de reserva." 
    });
  }

  try {
    if (channel) channel = channel.replace('#', '').trim().toLowerCase();

    const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, { method: 'POST' });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(200).json({ success: true, badges: defaultFallbackBadges });
    }

    const accessToken = tokenData.access_token;
    const headers = { 'Client-ID': clientId, 'Authorization': `Bearer ${accessToken}` };

    const globalBadgesRes = await fetch(`https://api.twitch.tv/helix/chat/badges/global`, { headers });
    const globalBadges = await globalBadgesRes.json();
    
    const allBadges = { ...defaultFallbackBadges };

    if (globalBadges.data) {
      globalBadges.data.forEach(set => {
        if (!allBadges[set.set_id]) allBadges[set.set_id] = {};
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
            set.versions.forEach(version => { 
                allBadges[set.set_id][version.id] = version.image_url_4x || version.image_url_2x || version.image_url_1x; 
            });
          });
        }
      }
    }

    res.status(200).json({ success: true, badges: allBadges });
  } catch (error) {
    res.status(200).json({ success: true, badges: defaultFallbackBadges });
  }
}