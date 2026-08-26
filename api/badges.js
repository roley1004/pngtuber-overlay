export default async function handler(req, res) {
  // Recibimos el nombre del canal que el chat está escuchando
  const { channel } = req.query;

  if (!channel) {
    return res.status(400).json({ error: 'Falta el nombre del canal' });
  }

  // Vercel inyectará estas claves secretas de forma segura
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Faltan credenciales de Twitch en Vercel' });
  }

  try {
    // 1. Pedimos permiso a Twitch (Token de Acceso) de forma anónima
    const tokenResponse = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, {
      method: 'POST'
    });
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Buscamos el ID numérico interno del canal usando su nombre
    const userResponse = await fetch(`https://api.twitch.tv/helix/users?login=${channel}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const userData = await userResponse.json();

    if (!userData.data || userData.data.length === 0) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }

    const broadcasterId = userData.data[0].id;

    // 3. Pedimos las insignias personalizadas de ese ID
    const badgesResponse = await fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${broadcasterId}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const badgesData = await badgesResponse.json();

    // Filtramos para enviar solo las de suscriptor al programa
    let subBadges = [];
    const subBadgeSet = badgesData.data.find(b => b.set_id === 'subscriber');
    if (subBadgeSet) {
      subBadges = subBadgeSet.versions; 
    }

    res.status(200).json({ success: true, subBadges });

  } catch (error) {
    res.status(500).json({ error: 'Error al conectar con Twitch' });
  }
}