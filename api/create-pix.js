// Vercel Serverless Function: api/create-pix.js
// Integração Oficial Homologada OmegaPayments API (/api/v1/gateway/pix/receive)

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

    const publicKey = 'startplataforma_hd2un77uamc15j81';
    const secretKey = '8paa692vn728sr39p50p8dl3bzlyxcrhn1kg2hx0t3z0x2fhc5tkaq7230vyl2t9';

    const identifier = `ph_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;

    const payload = {
      identifier: identifier,
      amount: amount,
      client: {
        name: 'Assinante VIP',
        email: 'cliente@privacyhub.com',
        phone: '(11) 99999-9999',
        document: '24823194047'
      },
      products: [
        {
          id: 'plan_vip',
          name: planName,
          quantity: 1,
          price: amount
        }
      ]
    };

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
    return res.status(200).json(data);

  } catch (error) {
    console.error('Erro na API OmegaPayments:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
