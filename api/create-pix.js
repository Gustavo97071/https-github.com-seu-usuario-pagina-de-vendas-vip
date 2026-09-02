// Vercel Serverless Function: api/create-pix.js
// Geração de PIX Dinâmico e 100% Válido para qualquer banco

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

    const payload = {
      payment_method_id: 'pix',
      transaction_amount: amount,
      payer: {
        email: 'cliente@privacyhub.com',
        first_name: 'Assinante',
        last_name: 'VIP',
        phone: '11999999999',
        identification: {
          type: 'CPF',
          number: '24823194047'
        }
      }
    };

    const gatewayRes = await fetch('https://maesantissima.com/api/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await gatewayRes.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
