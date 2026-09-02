// Vercel Serverless Function: api/create-pix.js
// Integração Nativa Exclusiva OmegaPayments / StartPlataforma

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
    const privateKey = '8paa692vn728sr39p50p8dl3bzlyxcrhn1kg2hx0t3z0x2fhc5tkaq7230vyl2t9';

    // Requisição Exclusiva para a API oficial da OmegaPayments
    const omegaRes = await fetch('https://app.omegapayments.com.br/api/v1/gateway/checkout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${privateKey}`,
        'x-public-key': publicKey,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      },
      body: JSON.stringify({
        paymentMethod: 'pix',
        amount: amount,
        description: planName,
        customer: {
          name: 'Cliente VIP',
          email: 'cliente@privacyhub.com',
          cpf: '00000000000'
        }
      })
    });

    const rawText = await omegaRes.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      data = { success: false, raw: rawText, status: omegaRes.status };
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Erro na Vercel Function OmegaPay:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
