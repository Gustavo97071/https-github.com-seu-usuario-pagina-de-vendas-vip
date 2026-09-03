// Vercel Serverless Function: api/track-event.js
// Envio de Eventos para a Meta Conversions API (CAPI) - PageView, InitiateCheckout, etc.

const crypto = require('crypto');

function hashSha256(val) {
  if (!val) return undefined;
  const str = String(val).trim().toLowerCase();
  if (!str) return undefined;
  return crypto.createHash('sha256').update(str).digest('hex');
}

function normalizePhone(phone) {
  if (!phone) return undefined;
  const clean = String(phone).replace(/\D/g, '');
  if (!clean) return undefined;
  const full = clean.startsWith('55') ? clean : `55${clean}`;
  return hashSha256(full);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { eventName, eventId, eventSourceUrl, userData = {}, customData = {} } = body;

    const pixelId = '1773244013995373';
    const accessToken = process.env.META_CONVERSION_API_TOKEN;

    if (!eventName || !eventId) {
      return res.status(400).json({ success: false, message: 'eventName e eventId são obrigatórios.' });
    }

    console.log(`[META CAPI] ${eventName} iniciado | Pedido: ${customData.order_id || 'N/A'} | Valor: R$ ${customData.value || '0.00'} | Event ID: ${eventId}`);

    if (!accessToken) {
      console.warn(`[META CAPI] META_CONVERSION_API_TOKEN não configurado. Evento ${eventName} processado apenas no navegador.`);
      return res.status(200).json({ success: true, message: 'Processado localmente (Token CAPI ausente).' });
    }

    // Captura IP e User Agent reais da requisição
    const clientIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress;
    const clientUserAgent = req.headers['user-agent'] || userData.client_user_agent;

    // Formatação de Dados do Usuário CAPI
    const formattedUserData = {
      client_ip_address: clientIp,
      client_user_agent: clientUserAgent,
      fbp: userData.fbp || undefined,
      fbc: userData.fbc || undefined,
      em: userData.email ? [hashSha256(userData.email)] : undefined,
      ph: userData.phone ? [normalizePhone(userData.phone)] : undefined,
      fn: userData.firstName ? [hashSha256(userData.firstName)] : undefined,
      ln: userData.lastName ? [hashSha256(userData.lastName)] : undefined,
      ct: userData.city ? [hashSha256(userData.city)] : undefined,
      st: userData.state ? [hashSha256(userData.state)] : undefined,
      zp: userData.zipCode ? [hashSha256(userData.zipCode)] : undefined,
      country: userData.country ? [hashSha256(userData.country)] : [hashSha256('br')]
    };

    // Remove chaves undefined
    Object.keys(formattedUserData).forEach(key => {
      if (formattedUserData[key] === undefined) delete formattedUserData[key];
    });

    const capiPayload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          event_source_url: eventSourceUrl || 'https://privacyhub-vip.vercel.app/',
          action_source: 'website',
          user_data: formattedUserData,
          custom_data: Object.keys(customData).length > 0 ? customData : undefined
        }
      ]
    };

    const graphUrl = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
    const capiRes = await fetch(graphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(capiPayload)
    });

    const capiData = await capiRes.json();

    if (capiRes.ok) {
      console.log(`[META CAPI] ${eventName} enviado com sucesso | Event ID: ${eventId}`);
      return res.status(200).json({ success: true, capiResponse: capiData });
    } else {
      console.error(`[META CAPI] Erro no envio do ${eventName}:`, capiData.error?.message || capiData);
      return res.status(400).json({ success: false, error: capiData });
    }

  } catch (error) {
    console.error('[META CAPI] Erro interno:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
