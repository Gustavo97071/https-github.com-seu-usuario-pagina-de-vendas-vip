document.addEventListener('DOMContentLoaded', () => {
  // 1. Cronômetro Regressivo de Urgência (15 Minutos)
  let totalSeconds = 15 * 60; // 15 minutos em segundos

  const elHours = document.getElementById('timerHours');
  const elMinutes = document.getElementById('timerMinutes');
  const elSeconds = document.getElementById('timerSeconds');

  function updateTimer() {
    if (totalSeconds <= 0) {
      // Reinicia o cronômetro para manter o senso de urgência
      totalSeconds = 15 * 60;
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    elHours.textContent = String(hours).padStart(2, '0');
    elMinutes.textContent = String(minutes).padStart(2, '0');
    elSeconds.textContent = String(seconds).padStart(2, '0');

    totalSeconds--;
  }

  setInterval(updateTimer, 1000);
  updateTimer();

  // 3. Simulação Dinâmica de Redução de Vagas Restantes
  const spotsCountEl = document.getElementById('spotsCount');
  let currentSpots = 7;

  setInterval(() => {
    if (currentSpots > 2) {
      currentSpots--;
      spotsCountEl.textContent = currentSpots;
    }
  }, 22000); // Reduz uma vaga a cada 22 segundos

  // 4. FAQ Accordion (Perguntas Frequentes)
  const accordionItems = document.querySelectorAll('.accordion-item');

  accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');
    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Fecha todos os outros itens
      accordionItems.forEach(otherItem => {
        otherItem.classList.remove('active');
      });

      // Se não estava ativo, abre
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // 5. Scroll Suave para Âncoras
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId !== '#') {
        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }
    });
  });
});
