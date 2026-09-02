/**
 * OmegaPay / StartPlataforma - Módulo de Integração Pix
 * Configuração de Credenciais & Geração de Cobrança (Escopo Global)
 */

const OMEGAPAY_CONFIG = {
  publicKey: 'startplataforma_ei2oyd5mmbclbpy5',
  privateKey: '8ph0a1y531w4tnvm6if94lgw07jozvqmmp6bfguymg78hx6mcjyagb7ay258av2j',
  apiEndpoint: 'https://api.startplataforma.com.br/v1/pix',
  sandbox: false
};

// Torna as funções acessíveis no escopo global (window)
window.processOmegaPayPix = async function(amount, planName, redirectUrl) {
  console.log(`[OmegaPay] Gerando cobrança Pix de R$ ${amount.toFixed(2)} para ${planName}...`);
  window.showPixModal(amount, planName, redirectUrl);
};

window.showPixModal = function(amount, planName, redirectUrl) {
  // Remove modal existente se houver
  const existingModal = document.getElementById('omegaPixModal');
  if (existingModal) existingModal.remove();

  // Código Pix Copia e Cola estático/simulado para a transação
  const mockPixPayload = `00020126580014BR.GOV.BCB.PIX0136${OMEGAPAY_CONFIG.publicKey}520400005303986540${amount.toFixed(2).replace('.', '')}5802BR5910PRIVACYHUB6009SAO PAULO62070503***6304`;

  const modalHtml = `
    <div id="omegaPixModal" class="omega-modal-overlay">
      <div class="omega-modal-card">
        <button onclick="window.closePixModal()" class="omega-close-btn">&times;</button>
        
        <div class="omega-modal-header">
          <div class="omega-logo-badge">⚡ PIX OMEGAPAY / STARTPLATAFORMA</div>
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
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mockPixPayload)}" alt="QR Code Pix" class="omega-qr-img">
          <p class="qr-instruction">Abra o aplicativo do seu banco, escolha <strong>Pix</strong> e escaneie o código acima ou copie o código Pix abaixo:</p>
        </div>

        <!-- Campo Pix Copia e Cola -->
        <div class="omega-copy-box">
          <input type="text" id="pixCodeInput" value="${mockPixPayload}" readonly onclick="this.select()">
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

        <!-- Botão para simular confirmação no teste -->
        <button onclick="window.simulatePixSuccess('${redirectUrl}')" class="btn-sim-pay-test">
          ✅ [SIMULAÇÃO DE TESTE] CLIQUE AQUI PARA SIMULAR PAGAMENTO CONFIRMADO
        </button>
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

window.simulatePixSuccess = function(redirectUrl) {
  const statusArea = document.getElementById('omegaStatusArea');
  if (statusArea) {
    statusArea.innerHTML = `
      <div style="background: rgba(0, 230, 118, 0.15); border: 1px solid #00e676; padding: 10px; border-radius: 8px; color: #00e676; font-weight: 800; font-size: 0.95rem;">
        ✓ PAGAMENTO CONFIRMADO PELA OMEGAPAY! Redirecionando...
      </div>
    `;
  }
  setTimeout(() => {
    window.location.href = redirectUrl || 'verificacao.html';
  }, 1500);
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
      font-size: 0.82rem; color: #aaa; margin-bottom: 15px;
    }
    .status-pulse {
      width: 10px; height: 10px; background: #00e676; border-radius: 50%;
      box-shadow: 0 0 10px #00e676; animation: pulsePix 1.5s infinite;
    }
    @keyframes pulsePix { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.5; } }
    .btn-sim-pay-test {
      background: rgba(0, 230, 118, 0.1); border: 1px solid #00e676; color: #00e676;
      font-weight: 800; font-size: 0.82rem; padding: 12px; border-radius: 8px; cursor: pointer; width: 100%;
      margin-top: 5px; transition: all 0.2s ease;
    }
    .btn-sim-pay-test:hover { background: rgba(0, 230, 118, 0.25); }
  `;
  document.head.appendChild(style);
};
