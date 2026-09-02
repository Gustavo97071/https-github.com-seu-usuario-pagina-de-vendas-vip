document.addEventListener('DOMContentLoaded', () => {
  // Elementos da Página
  const btnVerify = document.getElementById('btnVerify');
  const verificationModal = document.getElementById('verificationModal');
  const modalClose = document.getElementById('modalClose');
  const btnConfirmPaymentSim = document.getElementById('btnConfirmPaymentSim');
  const btnGoToContent = document.getElementById('btnGoToContent');

  // Passos do Modal
  const modalStep1 = document.getElementById('modalStep1');
  const modalStepProcessing = document.getElementById('modalStepProcessing');
  const modalStepSuccess = document.getElementById('modalStepSuccess');

  // Elementos do Tracker de Status Real
  const statusItemPayment = document.getElementById('statusItemPayment');
  const statusLabelPayment = document.getElementById('statusLabelPayment');

  const statusItemVerification = document.getElementById('statusItemVerification');
  const statusLabelVerification = document.getElementById('statusLabelVerification');

  const statusItemRefund = document.getElementById('statusItemRefund');
  const statusLabelRefund = document.getElementById('statusLabelRefund');

  const statusItemAccess = document.getElementById('statusItemAccess');
  const statusLabelAccess = document.getElementById('statusLabelAccess');

  // Estado do Sistema (Armazenado no sessionStorage)
  let currentState = sessionStorage.getItem('privacyhub_verif_state') || 'awaiting_payment';

  function updateStatusUI(state) {
    sessionStorage.setItem('privacyhub_verif_state', state);

    if (state === 'awaiting_payment') {
      statusItemPayment.className = 'status-item current';
      statusLabelPayment.textContent = 'Aguardando confirmação do valor de R$ 4,99...';

      statusItemVerification.className = 'status-item pending';
      statusLabelVerification.textContent = 'Pendente de pagamento';

      statusItemRefund.className = 'status-item pending';
      statusLabelRefund.textContent = 'Pendente de pagamento';

      statusItemAccess.className = 'status-item pending';
      statusLabelAccess.textContent = 'Bloqueado';
    }

    else if (state === 'payment_confirmed') {
      statusItemPayment.className = 'status-item completed';
      statusLabelPayment.textContent = '✓ Confirmado (R$ 4,99 recebido)';

      statusItemVerification.className = 'status-item current';
      statusLabelVerification.textContent = 'Iniciando análise de titularidade...';

      statusItemRefund.className = 'status-item pending';
      statusLabelRefund.textContent = 'Aguardando conclusão da verificação';

      statusItemAccess.className = 'status-item pending';
      statusLabelAccess.textContent = 'Aguardando verificação';
    }

    else if (state === 'verification_pending') {
      statusItemPayment.className = 'status-item completed';
      statusLabelPayment.textContent = '✓ Confirmado';

      statusItemVerification.className = 'status-item current';
      statusLabelVerification.textContent = '⏳ Analisando dados do titular...';
    }

    else if (state === 'identity_verified') {
      statusItemPayment.className = 'status-item completed';
      statusLabelPayment.textContent = '✓ Confirmado';

      statusItemVerification.className = 'status-item completed';
      statusLabelVerification.textContent = '✓ Identidade Confirmada';

      statusItemRefund.className = 'status-item current';
      statusLabelRefund.textContent = '⚡ Solicitando estorno automático de R$ 4,99...';
    }

    else if (state === 'refund_processed' || state === 'access_released') {
      statusItemPayment.className = 'status-item completed';
      statusLabelPayment.textContent = '✓ Confirmado';

      statusItemVerification.className = 'status-item completed';
      statusLabelVerification.textContent = '✓ Identidade Confirmada';

      statusItemRefund.className = 'status-item completed';
      statusLabelRefund.textContent = '✓ Reembolso de R$ 4,99 efetuado com sucesso';

      statusItemAccess.className = 'status-item completed';
      statusLabelAccess.textContent = '🎉 ACESSO LIBERADO!';
    }
  }

  // Inicializa a interface com o estado atual
  updateStatusUI(currentState);

  // Fechar Modal local se aberto
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      if (verificationModal) verificationModal.style.display = 'none';
    });
  }

  // Fluxo de Confirmação e Processamento
  btnConfirmPaymentSim.addEventListener('click', () => {
    // 1. Pagamento Confirmado
    updateStatusUI('payment_confirmed');
    modalStep1.style.display = 'none';
    modalStepProcessing.style.display = 'block';

    // 2. Análise de Identidade
    setTimeout(() => {
      updateStatusUI('verification_pending');
      document.getElementById('procStepTitle').textContent = 'Consultando bases de verificação...';
    }, 1500);

    // 3. Identidade Confirmada & Reembolso Processado
    setTimeout(() => {
      updateStatusUI('identity_verified');
      document.getElementById('procStepTitle').textContent = 'Processando estorno automático de R$ 4,99...';
    }, 3200);

    // 4. Conclusão & Liberação do Acesso
    setTimeout(() => {
      updateStatusUI('refund_processed');
      updateStatusUI('access_released');

      modalStepProcessing.style.display = 'none';
      modalStepSuccess.style.display = 'block';
    }, 4800);
  });

  // Redirecionamento para a Página de Conteúdo Liberado
  btnGoToContent.addEventListener('click', () => {
    window.location.href = 'acesso-liberado.html';
  });
});
