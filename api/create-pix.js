// Vercel Serverless Function: api/create-pix.js
// Integração Oficial Homologada OmegaPayments API + Meta Conversions API (CAPI)

const crypto = require('crypto');

// Trava em memória para deduplicação de Purchase (Evita disparos duplicados)
const processedPurchases = new Set();

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
    const amount = parseFloat(body.amount) || 9.90;
    const planName = body.planName || 'Plano VIP';
    const productId = body.productId || (amount === 19.90 ? 'plan_vitalicio' : (amount === 4.99 ? 'plan_verificacao' : 'plan_mensal'));
    const userData = body.userData || {};

    const publicKey = 'startplataforma_hd2un77uamc15j81';
    const secretKey = '8paa692vn728sr39p50p8dl3bzlyxcrhn1kg2hx0t3z0x2fhc5tkaq7230vyl2t9';

    const identifier = `ph_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;

    const payload = {
      identifier: identifier,
      amount: amount,
      client: {
        name: userData.name || 'Assinante VIP',
        email: userData.email || 'cliente@privacyhub.com',
        phone: userData.phone || '(11) 99999-9999',
        document: userData.document || '24823194047'
      },
      products: [
        {
          id: productId,
          name: planName,
          quantity: 1,
          price: amount
        }
      ]
    };

    // 1. Envia requisição para a API oficial da OmegaPayments
    const omegaRes = await fetch('https://app.omegapayments.com.br/api/v1/gateway/pix/receive', {
      method: 'POST',
      headers: {
        'x-public-key': publicKey,
        'x-secret-key': secretKey,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      },
      body: JSON.stringify(payload)
    });

    const data = await omegaRes.json();

    // 2. REGRA ESPECÍFICA: PIX GERADO = PURCHASE (Meta CAPI Server-Side)
    if (omegaRes.ok && data && (data.status === 'OK' || data.pix?.code)) {
      const transactionId = data.transactionId || data.order?.id || identifier;
      const eventId = `pur_${transactionId}`;

      // Trava de Deduplicação
      if (!processedPurchases.has(transactionId)) {
        processedPurchases.add(transactionId);

        console.log(`[META CAPI] Purchase iniciado | Pedido: ${transactionId} | Valor: R$ ${amount.toFixed(2)} | Event ID: ${eventId}`);

        const accessToken = process.env.META_CONVERSION_API_TOKEN;
        if (accessToken) {
          try {
            const pixelId = '1773244013995373';
            const clientIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress;
            const clientUserAgent = req.headers['user-agent'] || userData.client_user_agent;

            const capiPayload = {
              data: [
                {
                  event_name: 'Purchase',
                  event_time: Math.floor(Date.now() / 1000),
                  event_id: eventId,
                  event_source_url: body.eventSourceUrl || 'https://privacyhub-vip.vercel.app/',
                  action_source: 'website',
                  user_data: {
                    client_ip_address: clientIp,
                    client_user_agent: clientUserAgent,
                    fbp: userData.fbp || undefined,
                    fbc: userData.fbc || undefined,
                    em: [hashSha256(userData.email || 'cliente@privacyhub.com')],
                    ph: [normalizePhone(userData.phone || '11999999999')],
                    fn: [hashSha256('Assinante')],
                    ln: [hashSha256('VIP')],
                    country: [hashSha256('br')]
                  },
                  custom_data: {
                    value: amount,
                    currency: 'BRL',
                    content_name: planName,
                    content_ids: [productId],
                    content_type: 'product',
                    order_id: transactionId
                  }
                }
              ]
            };

            const capiRes = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(capiPayload)
            });

            const capiResData = await capiRes.json();
            if (capiRes.ok) {
              console.log(`[META CAPI] Purchase enviado com sucesso | Pedido: ${transactionId}`);
            } else {
              console.error('[META CAPI] Erro no envio do Purchase:', capiResData.error?.message || capiResData);
            }
          } catch (capiErr) {
            console.error('[META CAPI] Erro ao enviar Purchase CAPI:', capiErr);
          }
        } else {
          console.warn(`[META CAPI] META_CONVERSION_API_TOKEN não configurado. Purchase CAPI não enviado pelo servidor.`);
        }

        // Anexa eventId e flag no retorno JSON para o browser disparar o Pixel com o MESMO eventId
        data.meta_event_id = eventId;
        data.meta_purchase_sent = true;
      } else {
        console.log(`[META CAPI] Purchase ignorado (Já enviado anteriormente para este pedido) | Pedido: ${transactionId}`);
      }
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Erro na API OmegaPayments:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
