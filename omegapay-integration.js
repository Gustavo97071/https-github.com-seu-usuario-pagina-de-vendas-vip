/**
 * Módulo de Integração Pix Oficial OmegaPayments + Meta Pixel & Conversions API (CAPI)
 * Eventos: PageView, InitiateCheckout, Purchase (PIX GERADO = PURCHASE com Deduplicação)
 */

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

window.processOmegaPayPix = async function(amount, planName, redirectUrl) {
  console.log(`[OmegaPay Oficial] Gerando cobrança Pix de R$ ${amount.toFixed(2)} (${planName})...`);

  const productId = amount === 19.90 ? 'plan_vitalicio' : (amount === 4.99 ? 'plan_verificacao' : 'plan_mensal');
  const initiateEventId = `init_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;

  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');

  // 1. DISPARO DO EVENTO INITIATECHECKOUT (Navegador + Server CAPI)
  if (window.fbq) {
    fbq('track', 'InitiateCheckout', {
      value: amount,
      currency: 'BRL',
      content_name: planName,
      content_ids: [productId],
      content_type: 'product'
    }, {
      eventID: initiateEventId
    });
    console.log('[Meta Pixel] InitiateCheckout disparado no browser | Event ID:', initiateEventId);
  }

  // CAPI Server-side para InitiateCheckout
  try {
    fetch('/api/track-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'InitiateCheckout',
        eventId: initiateEventId,
        eventSourceUrl: window.location.href,
        userData: { fbp, fbc },
        customData: {
          value: amount,
          currency: 'BRL',
          content_name: planName,
          content_ids: [productId],
          content_type: 'product'
        }
      })
    });
  } catch (err) {
    console.warn('[Meta CAPI] Erro ao enviar InitiateCheckout:', err);
  }

  let realPixCode = null;
  let realQrCodeUrl = null;

  try {
    // 2. Chamada ao Backend Serverless para Gerar o PIX + CAPI Purchase
    const response = await fetch('/api/create-pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        planName: planName,
        productId: productId,
        eventSourceUrl: window.location.href,
        userData: { fbp, fbc }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[OmegaPay Response]', data);
      
      if (data && data.pix && data.pix.code) {
        realPixCode = data.pix.code;
        realQrCodeUrl = data.pix.image || `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(realPixCode)}`;

        // 3. REGRA ESPECÍFICA: PIX GERADO = PURCHASE (Disparo no Navegador com o MESMO Event ID)
        if (data.meta_event_id && window.fbq) {
          fbq('track', 'Purchase', {
            value: amount,
            currency: 'BRL',
            content_name: planName,
            content_ids: [productId],
            content_type: 'product'
          }, {
            eventID: data.meta_event_id
          });
          console.log('[Meta Pixel] Purchase disparado no browser após geração do PIX | Event ID:', data.meta_event_id);
        }
      }
    }
  } catch (err) {
    console.error('[OmegaPay Error]', err);
  }

  // 4. Exibe o modal com o Pix oficial gerado pela OmegaPayments
  window.showPixModal(amount, planName, redirectUrl, realPixCode, realQrCodeUrl);
};

window.showPixModal = function(amount, planName, redirectUrl, pixPayload, qrCodeUrl) {
  // Remove modal existente se houver
  const existingModal = document.getElementById('omegaPixModal');
  if (existingModal) existingModal.remove();

  const finalPixPayload = pixPayload || '';
  const finalQrImage = qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(finalPixPayload)}`;

  const modalHtml = `
    <div id="omegaPixModal" class="omega-modal-overlay">
      <div class="omega-modal-card">
        <button onclick="window.closePixModal()" class="omega-close-btn">&times;</button>
        
        <div class="omega-modal-header">
          <div class="omega-logo-badge">⚡ PIX OMEGAPAYMENTS OFICIAL</div>
          <h2>Pagamento Seguro via Pix</h2>
          <p>Você está adquirindo: <strong>${planName}</strong></p>
        </div>

        <div class="omega-price-tag">
          <small>Valor a pagar:</small>
          <div class="price-value">R$ ${amount.toFixed(2).replace('.', ',')}</div>
          <span class="instant-tag">✓ Liberação Imediata 24h</span>
        </div>

        <!-- QR Code e Copia e Cola -->
        <div class="omega-qr-container">
          <img src="${finalQrImage}" alt="QR Code Pix" class="omega-qr-img">
          <p class="qr-instruction">Abra o aplicativo do seu banco, escolha <strong>Pix</strong> e escaneie o código acima ou copie o código Pix abaixo:</p>
        </div>

        <!-- Campo Pix Copia e Cola -->
        <div class="omega-copy-box">
          <input type="text" id="pixCodeInput" value="${finalPixPayload}" readonly onclick="this.select()">
          <button onclick="window.copyPixCode()" id="btnCopyPix" class="btn-copy-pix">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            COPIAR CÓDIGO PIX COPIA E COLA
          </button>
        </div>

        <div class="omega-timer-box">
          <span>⏱️ Este código expira em <strong id="pixCountdown">14:59</strong></span>
        </div>

        <div id="omegaStatusArea" class="omega-footer-status">
          <div class="status-pulse"></div>
          <span>Aguardando confirmação do pagamento no banco...</span>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  window.injectOmegaCss();
  window.startPixTimer();
};

window.closePixModal = function() {
  const modal = document.getElementById('omegaPixModal');
  if (modal) modal.remove();
};

window.copyPixCode = function() {
  const input = document.getElementById('pixCodeInput');
  const btn = document.getElementById('btnCopyPix');
  
  if (input) {
    input.select();
    input.setSelectionRange(0, 99999);
    
    try {
      navigator.clipboard.writeText(input.value);
    } catch (err) {
      document.execCommand('copy');
    }

    if (btn) {
      btn.innerHTML = '✓ CÓDIGO PIX COPIADO COM SUCESSO!';
      btn.style.background = '#00e676';
      btn.style.color = '#000';

      setTimeout(() => {
        btn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg> COPIAR CÓDIGO PIX COPIA E COLA`;
        btn.style.background = '#ff9900';
        btn.style.color = '#000';
      }, 3000);
    }
  }
};

window.startPixTimer = function() {
  let seconds = 15 * 60;
  const display = document.getElementById('pixCountdown');
  if (!display) return;

  const timer = setInterval(() => {
    if (seconds <= 0) {
      clearInterval(timer);
      if (display) display.textContent = 'EXPIRADO';
      return;
    }
    seconds--;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (display) display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, 1000);
};

window.injectOmegaCss = function() {
  if (document.getElementById('omegaModalStyles')) return;
  const style = document.createElement('style');
  style.id = 'omegaModalStyles';
  style.innerHTML = `
    .omega-modal-overlay {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.92);
      backdrop-filter: blur(10px); z-index: 999999;
      display: flex; align-items: center; justify-content: center; padding: 15px;
      overflow-y: auto;
    }
    .omega-modal-card {
      background: #141419; border: 1px solid #2b2b36; border-radius: 20px;
      padding: 28px 22px; max-width: 480px; width: 100%; text-align: center;
      position: relative; box-shadow: 0 20px 50px rgba(0,0,0,0.9), 0 0 35px rgba(255, 153, 0, 0.25);
    }
    .omega-close-btn {
      position: absolute; top: 12px; right: 15px; background: none; border: none;
      color: #888; font-size: 2rem; cursor: pointer; line-height: 1;
    }
    .omega-logo-badge {
      display: inline-block; background: #00e676; color: #000; font-weight: 900;
      font-size: 0.75rem; padding: 4px 14px; border-radius: 50px; margin-bottom: 10px;
    }
    .omega-modal-header h2 { font-size: 1.35rem; font-weight: 800; color: #fff; margin-bottom: 4px; }
    .omega-modal-header p { font-size: 0.88rem; color: #aaa; margin-bottom: 15px; }
    .omega-price-tag {
      background: #1d1d24; border: 1px solid #2b2b36; border-radius: 12px;
      padding: 14px; margin-bottom: 18px;
    }
    .omega-price-tag small { font-size: 0.75rem; color: #888; display: block; }
    .price-value { font-size: 2.2rem; font-weight: 900; color: #ff9900; line-height: 1.1; }
    .instant-tag { font-size: 0.78rem; color: #00e676; font-weight: 700; }
    .omega-qr-container { margin-bottom: 18px; }
    .omega-qr-img { width: 170px; height: 170px; border-radius: 12px; border: 4px solid #fff; margin-bottom: 10px; }
    .qr-instruction { font-size: 0.82rem; color: #bbb; line-height: 1.4; }
    .omega-copy-box { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
    .omega-copy-box input {
      background: #0b0b0e; border: 1px solid #333; border-radius: 8px; color: #aaa;
      padding: 10px; font-size: 0.75rem; text-align: center; font-family: monospace;
    }
    .btn-copy-pix {
      background: #ff9900; color: #000; font-weight: 900; font-size: 0.9rem;
      padding: 14px; border: none; border-radius: 8px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: all 0.2s ease;
    }
    .btn-copy-pix:hover { background: #ffaa22; }
    .omega-timer-box { font-size: 0.8rem; color: #ff5500; margin-bottom: 15px; }
    .omega-footer-status {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      font-size: 0.82rem; color: #aaa; margin-bottom: 5px;
    }
    .status-pulse {
      width: 10px; height: 10px; background: #00e676; border-radius: 50%;
      box-shadow: 0 0 10px #00e676; animation: pulsePix 1.5s infinite;
    }
    @keyframes pulsePix { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.5; } }
  `;
  document.head.appendChild(style);
};
