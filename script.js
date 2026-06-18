// URL do seu próprio backend (se rodando local, será vazio ou localhost)
const API_URL = ""; // Deixe vazio se o frontend e backend rodam no mesmo servidor

// ==========================================
// TIMER DE OFERTA (escassez)
// ==========================================
(function() {
  var TIMER_KEY = 'cc_offer_end';
  var now = Date.now();
  var endTime = parseInt(sessionStorage.getItem(TIMER_KEY), 10);

  // Se não existe ou já expirou, gera novo tempo entre 8 e 14 minutos
  if (!endTime || endTime <= now) {
    var mins = 8 + Math.floor(Math.random() * 7); // 8–14 min
    endTime = now + mins * 60 * 1000;
    sessionStorage.setItem(TIMER_KEY, endTime);
  }

  function updateTimer() {
    var el = document.getElementById('offerTimer');
    if (!el) return;
    var remaining = Math.max(0, endTime - Date.now());
    var m = Math.floor(remaining / 60000);
    var s = Math.floor((remaining % 60000) / 1000);
    el.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    if (remaining <= 0) {
      // Reseta o timer silenciosamente
      var newMins = 8 + Math.floor(Math.random() * 7);
      endTime = Date.now() + newMins * 60 * 1000;
      sessionStorage.setItem(TIMER_KEY, endTime);
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    updateTimer();
    setInterval(updateTimer, 1000);
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gtag === 'function') {
    gtag('event', 'visitante_pagina');
  }

  setTimeout(() => {
    if (typeof gtag === 'function') gtag('event', 'tempo_30s');
  }, 30000);

  setTimeout(() => {
    if (typeof gtag === 'function') gtag('event', 'tempo_60s');
  }, 60000);

  let scroll50Fired = false;
  let scroll90Fired = false;
  window.addEventListener('scroll', () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    const scrollPercent = (window.scrollY / scrollHeight) * 100;
    
    if (scrollPercent >= 50 && !scroll50Fired) {
      scroll50Fired = true;
      if (typeof gtag === 'function') gtag('event', 'scroll_50');
    }
    if (scrollPercent >= 90 && !scroll90Fired) {
      scroll90Fired = true;
      if (typeof gtag === 'function') gtag('event', 'scroll_90');
    }
  });

  const phoneInput = document.getElementById("buyerPhone");
  if (phoneInput) {
    phoneInput.addEventListener("blur", (e) => {
      if (e.target.value.replace(/\D/g, '').length > 0) {
        if (typeof gtag === 'function') gtag('event', 'telefone_preenchido');
      }
    }, { once: true });
  }

  const emailInput = document.getElementById("buyerEmail");
  if (emailInput) {
    emailInput.addEventListener("blur", (e) => {
      if (e.target.value.trim().length > 0) {
        if (typeof gtag === 'function') gtag('event', 'email_preenchido');
      }
    }, { once: true });
  }

  // Verificação de cookies
  checkCookies();

  // Ação do botão de voltar
  const backBtn = document.querySelector(".left-container");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.history.back();
    });
  }

  // Lógica das Abas (Tabs) - Mídias vs Postagens
  const tabBtns = document.querySelectorAll(".tab-btn");
  const contentMidias = document.getElementById("content-midias");
  const contentPostagens = document.getElementById("content-postagens");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all tabs
      tabBtns.forEach((t) => t.classList.remove("active"));
      // Add active class to clicked tab
      btn.classList.add("active");

      const target = btn.getAttribute("data-target");
      if (target === "postagens") {
        contentMidias.style.display = "none";
        contentPostagens.style.display = "block";
      } else if (target === "midias") {
        contentPostagens.style.display = "none";
        contentMidias.style.display = "block";
      }
    });
  });

  // Lógica de Filtros (Todos, Fotos, Vídeos, Pagos)
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((f) => f.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Lógica do botão "Ler mais"
  const readMoreBtn = document.getElementById("readMoreBtn");
  const bioText = document.querySelector(".bio-text");

  if (readMoreBtn && bioText) {
    const shortText =
      "oi mô 🥰 eu sou a Camilachan, sua peituda da cintura fininha e olhos verdes 💚 posso fazer meu daddyzinho feliz? aq eu posto muita putaria 🙈 se vc for fã de uma rosadinha esse será seu...";
    const fullText =
      "oi mô 🥰 eu sou a Camilachan, sua peituda da cintura fininha e olhos verdes 💚 posso fazer meu daddyzinho feliz? aq eu posto muita putaria 🙈 se vc for fã de uma rosadinha esse será seu lugar favorito haha 🌸 me chama no chat que eu mesma respondo, tô doidinha pra gente gozar bem gostoso junto, vc vem? 💦";

    readMoreBtn.addEventListener("click", () => {
      bioText.textContent = fullText;
      readMoreBtn.style.display = "none";
      // Remover também a tag <br> se desejar, mas como readMoreBtn some não atrapalha
    });
  }
});

// Funções do Banner de Cookies
function checkCookies() {
  const cookieContainer = document.querySelector(".cookie-container");
  if (localStorage.getItem("privacy_disclaimer") !== "accepted") {
    cookieContainer.style.display = "flex";
  } else {
    cookieContainer.style.display = "none";
  }
}

function acceptCookies() {
  localStorage.setItem("privacy_disclaimer", "accepted");
  document.querySelector(".cookie-container").style.display = "none";
}

// Funções do Modal Perfeito
let modalInterval;
let basePriceStr = "";
let bumpPriceStr = "";
let bumpActive = false;

function toggleOrderBump() {
  bumpActive = !bumpActive;
  const check = document.getElementById("orderBumpCheck");
  const container = document.getElementById("orderBumpContainer");
  const priceInput = document.getElementById("buyerValue");
  if(check) check.checked = bumpActive;
  
  if (bumpActive) {
    if(container) {
      container.style.background = "#fadbd8";
      container.style.border = "2px solid #e74c3c";
    }
    let base = parseFloat(basePriceStr.replace(',', '.'));
    let bump = parseFloat(bumpPriceStr.replace(',', '.'));
    if(priceInput) priceInput.value = (base + bump).toFixed(2).replace('.', ',');
  } else {
    if(container) {
      container.style.background = "#fdf2f0";
      container.style.border = "2px dashed #e74c3c";
    }
    if(priceInput) priceInput.value = basePriceStr;
  }
}

function openPaymentModal(title, defaultPrice) {
  if (typeof gtag === 'function') {
    gtag('event', 'plano_clicado', {
      nome_plano: title,
      valor_plano: defaultPrice
    });
    gtag('event', 'checkout_aberto', {
      nome_plano: title,
      valor_plano: defaultPrice
    });
  }

  const modal = document.getElementById("paymentModal");
  const modalTitle = document.getElementById("modalTitle");
  const priceInput = document.getElementById("buyerValue");
  const mimoPresets = document.getElementById("mimoPresets");
  const valueGroup = document.getElementById("valueGroup");

  const bumpContainer = document.getElementById("orderBumpContainer");
  const bumpPriceDisplay = document.getElementById("bumpPriceDisplay");
  const bumpDesc = document.getElementById("bumpDesc");
  const check = document.getElementById("orderBumpCheck");
  
  bumpActive = false;
  if(check) check.checked = false;
  if(bumpContainer) {
    bumpContainer.style.background = "#fdf2f0";
    bumpContainer.style.border = "2px dashed #e74c3c";
  }

  modalTitle.textContent = title;

  if (defaultPrice) {
    priceInput.value = defaultPrice;
    basePriceStr = defaultPrice;
    mimoPresets.style.display = "none";
    valueGroup.style.display = "none";
    
    // Set dynamic order bump based on plan
    if (defaultPrice === '14,90') {
        bumpPriceStr = '14,90';
        if(bumpPriceDisplay) bumpPriceDisplay.textContent = 'R$ 14,90';
        if(bumpDesc) bumpDesc.textContent = 'LEVAR TUDO: Adicione o "Acesso ao Drive Completo" com +250 mídias.';
        if(bumpContainer) bumpContainer.style.display = 'block';
    } else if (defaultPrice === '29,90' || defaultPrice === '19,90') {
        bumpPriceStr = '9,90';
        if(bumpPriceDisplay) bumpPriceDisplay.textContent = 'R$ 9,90';
        if(bumpDesc) bumpDesc.textContent = 'Adicione o "Pack de Áudios Proibidos" por apenas R$ 9,90.';
        if(bumpContainer) bumpContainer.style.display = 'block';
    } else if (defaultPrice === '97,90') {
        bumpPriceStr = '29,90';
        if(bumpPriceDisplay) bumpPriceDisplay.textContent = 'R$ 29,90';
        if(bumpDesc) bumpDesc.textContent = 'Adicione o "Vídeo Cheirando a Calcinha" por apenas R$ 29,90.';
        if(bumpContainer) bumpContainer.style.display = 'block';
    } else {
        if(bumpContainer) bumpContainer.style.display = 'none';
    }
    
    // Set dynamic downsell based on plan
    const downsellLabel = document.getElementById("downsellPriceLabel");
    if (downsellLabel) {
       if (defaultPrice === '14,90') downsellLabel.textContent = 'R$ 9,90';
       else if (defaultPrice === '19,90') downsellLabel.textContent = 'R$ 9,90';
       else if (defaultPrice === '29,90') downsellLabel.textContent = 'R$ 14,90';
       else downsellLabel.textContent = 'R$ 19,90';
    }

  } else {
    priceInput.value = "";
    mimoPresets.style.display = "flex";
    valueGroup.style.display = "block";
    if(bumpContainer) bumpContainer.style.display = 'none';
  }

  modal.classList.add("active");

  // Trigger Fake Chat Notification
  setTimeout(() => {
    const fakeChatWidget = document.getElementById("fakeChatWidget");
    const fakeChatBody = document.getElementById("fakeChatBody");
    const audio = document.getElementById("notificacaoAudio");
    
    if (fakeChatWidget && fakeChatBody && audio) {
      // Garante que o widget está visível
      fakeChatWidget.classList.add("show");
      
      // Toca o som (se o navegador permitir autoplay baseado na interação do usuário)
      audio.play().catch(e => console.log('Áudio bloqueado pelo navegador', e));
      
      // Cria a nova mensagem
      const newMsg = document.createElement("div");
      newMsg.className = "chat-msg";
      newMsg.textContent = "nao vai falar comigo? 🥺";
      fakeChatBody.appendChild(newMsg);
      
      // Rola para o final do chat
      fakeChatBody.scrollTop = fakeChatBody.scrollHeight;
      
      // Anima a mensagem para aparecer suavemente
      setTimeout(() => {
        newMsg.classList.add("show");
      }, 50);
    }
  }, 800); // Aparece 800ms após abrir o modal

  // Iniciar timer do modal (5 minutos)
  clearInterval(modalInterval);
  let timeRemaining = 300;
  const timerEl = document.getElementById("modalTimer");
  if (timerEl) {
    timerEl.textContent = "05:00";
    modalInterval = setInterval(() => {
      timeRemaining--;
      if (timeRemaining <= 0) {
        timeRemaining = 0;
        clearInterval(modalInterval);
      }
      const m = Math.floor(timeRemaining / 60);
      const s = timeRemaining % 60;
      timerEl.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }, 1000);
  }
}

function setPresetValue(val) {
  document.getElementById("buyerValue").value = val;
}

function showModalError(msg) {
  const errDiv = document.getElementById("modalError");
  errDiv.textContent = msg;
  errDiv.style.display = "block";
}

function hideModalError() {
  document.getElementById("modalError").style.display = "none";
}

async function submitPayment() {
  if (typeof gtag === 'function') {
    gtag('event', 'botao_pix_clicado');
  }

  hideModalError();

  const name = "Cliente VIP";
  const phone = "119" + Math.floor(10000000 + Math.random() * 90000000); // Gerado automaticamente
  const email = "cliente_" + Date.now() + "@vip.com"; // Gerado automaticamente
  
  const value = document.getElementById("buyerValue").value.trim();
  const title = document.getElementById("modalTitle").textContent;
  const btn = document.querySelector(".modal-submit-btn");

  if (!value) {
    showModalError("Ocorreu um erro com o valor do plano.");
    return;
  }

  // Mudar estado do botão para feedback visual
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gerando PIX...';
  btn.disabled = true;

  try {
    const response = await fetch(`${API_URL}/api/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, cpf: "", phone, email, value, title }),
    });

    const data = await response.json();

    if (data.success) {
      if (typeof gtag === 'function') {
        gtag('event', 'pix_gerado', {
          valor: value,
          produto: title
        });
      }

      // Exibe a tela de PIX e oculta o formulário inicial
      document.getElementById("modalForm").style.display = "none";
      document.getElementById("modalPix").style.display = "flex";

      // Seta o Base64 gerado pelo Node.js e o Pix Copia e Cola
      document.getElementById("pixQrCodeImg").src = data.qrCodeBase64;
      document.getElementById("pixCopiaEColaText").value = data.pixCopiaECola;
    } else {
      showModalError(data.message || "Houve um erro ao gerar o pagamento.");
    }
  } catch (err) {
    console.error(err);
    showModalError("Erro de conexão com o servidor. O backend está rodando?");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

function copyPix() {
  if (typeof gtag === 'function') {
    gtag('event', 'pix_copiado');
  }

  const pixText = document.getElementById("pixCopiaEColaText");
  pixText.select();
  pixText.setSelectionRange(0, 99999);
  document.execCommand("copy");

  const copyBtn = document.getElementById("copyPixBtn");
  copyBtn.innerHTML = "Copiado!";
  setTimeout(() => {
    copyBtn.innerHTML = "Copiar";
  }, 2000);

  // POST-PURCHASE UPSELL: Show 2.5 seconds after copying PIX
  setTimeout(() => {
    const modalPix = document.getElementById("modalPix");
    const modalUpsell = document.getElementById("modalUpsell");
    const modalTitle = document.getElementById("modalTitle");
    const subtitle = document.querySelector(".modal-subtitle");
    
    if (modalPix && modalUpsell) {
      modalPix.style.display = "none";
      modalUpsell.style.display = "block";
      
      if(modalTitle) modalTitle.style.display = "none";
      if(subtitle) subtitle.style.display = "none";
    }
  }, 2500);
}

let isRetaining = false;

function closePaymentModal() {
  if (!isRetaining) {
    isRetaining = true;
    
    document.getElementById("modalForm").style.display = "none";
    document.getElementById("modalPix").style.display = "none";
    document.getElementById("modalRetention").style.display = "flex";
    
    document.getElementById("modalTitle").style.display = "none";
    const subtitle = document.querySelector(".modal-subtitle");
    if(subtitle) subtitle.style.display = "none";
    const closeBtn = document.querySelector(".modal-close");
    if(closeBtn) closeBtn.style.display = "none";
  }
}

function acceptDownsell() {
  const downsellLabel = document.getElementById("downsellPriceLabel");
  if(downsellLabel) {
    let newPrice = downsellLabel.textContent.replace('R$ ', '').trim();
    document.getElementById("buyerValue").value = newPrice;
  }
  
  // Return to form and submit
  isRetaining = false;
  document.getElementById("modalRetention").style.display = "none";
  document.getElementById("modalTitle").style.display = "block";
  const subtitle = document.querySelector(".modal-subtitle");
  if(subtitle) subtitle.style.display = "block";
  document.getElementById("modalForm").style.display = "block";
  
  submitPayment();
}

function continuePayment() {
  isRetaining = false;
  document.getElementById("modalRetention").style.display = "none";
  document.getElementById("modalTitle").style.display = "block";
  const subtitle = document.querySelector(".modal-subtitle");
  if(subtitle) subtitle.style.display = "block";
  const closeBtn = document.querySelector(".modal-close");
  if(closeBtn) closeBtn.style.display = "block";
  
  const pixCopiaECola = document.getElementById("pixCopiaEColaText");
  if (pixCopiaECola && pixCopiaECola.value.length > 10) {
     document.getElementById("modalPix").style.display = "flex";
  } else {
     document.getElementById("modalForm").style.display = "block";
  }
}

function forceCloseModal() {
  isRetaining = false;
  clearInterval(modalInterval);
  const modal = document.getElementById("paymentModal");
  modal.classList.remove("active");

  setTimeout(() => {
    document.getElementById("modalRetention").style.display = "none";
    document.getElementById("modalForm").style.display = "block";
    document.getElementById("modalPix").style.display = "none";
    document.getElementById("modalTitle").style.display = "block";
    const subtitle = document.querySelector(".modal-subtitle");
    if(subtitle) subtitle.style.display = "block";
    const closeBtn = document.querySelector(".modal-close");
    if(closeBtn) closeBtn.style.display = "block";

    document.getElementById("buyerValue").value = "";
    if (document.getElementById("buyerPhone")) document.getElementById("buyerPhone").value = "";
    if (document.getElementById("buyerEmail")) document.getElementById("buyerEmail").value = "";
    if (document.getElementById("pixCopiaEColaText")) document.getElementById("pixCopiaEColaText").value = "";
    document.getElementById("mimoPresets").style.display = "none";
    document.getElementById("valueGroup").style.display = "block";
    hideModalError();
  }, 300);
}

// ==========================
// Máscaras de Input
// ==========================
document.getElementById("buyerPhone").addEventListener("input", function (e) {
  let value = e.target.value.replace(/\D/g, "");
  if (value.length > 11) value = value.slice(0, 11);
  if (value.length > 2) {
    value = value.replace(/^(\d{2})(\d)/, "($1) $2");
  }
  if (value.length > 9) {
    value = value.replace(/(\d{5})(\d)/, "$1-$2");
  } else if (value.length > 8) {
    value = value.replace(/(\d{4})(\d)/, "$1-$2");
  }
  e.target.value = value;
});

// ==========================================
// FAKE SALES NOTIFICATIONS (TOASTS)
// ==========================================
(function() {
  const names = ["Carlos M.", "João P.", "Lucas T.", "Marcos S.", "Felipe R.", "Rafael C.", "Bruno L.", "Thiago A.", "Pedro H.", "Gabriel N.", "André V.", "Mateus C.", "Guilherme B.", "Vitor D."];
  const plans = ["Desbloqueio Total", "Vídeo Chamada VIP", "Encontro Real", "Minha Calcinha Usada", "Pack Safada VIP"];
  const actions = ["acabou de comprar", "garantiu o acesso a", "reservou o pacote"];
  
  function showToast() {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const name = names[Math.floor(Math.random() * names.length)];
    const plan = plans[Math.floor(Math.random() * plans.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];

    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.innerHTML = `
      <div class="toast-icon"><i class="fa-solid fa-check"></i></div>
      <div class="toast-text">${name} ${action} <strong>${plan}</strong></div>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
      toast.classList.add("show");
    }, 100);

    // Remove after 4 seconds
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 4000);
  }

  // Show random toasts every 10 to 25 seconds
  function scheduleNextToast() {
    const delay = Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000;
    setTimeout(() => {
      showToast();
      scheduleNextToast();
    }, delay);
  }

  // Initial toast faster to show proof right away
  setTimeout(showToast, 3000);
  scheduleNextToast();
})();

function loadMoreComments() {
  const extra = document.getElementById("extraComments");
  const btn = document.getElementById("loadMoreBtn");
  
  if(btn) {
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Carregando...';
    setTimeout(() => {
      if(extra) {
        extra.style.display = "flex";
        extra.style.animation = "slideUp 0.5s ease";
      }
      btn.style.display = "none";
    }, 800);
  }
}

// Lógica das Abas de Mídia (Fotos, Vídeos, Ao Vivo)
window.filterMedia = function(filter, btnElement) {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const mediaItems = document.querySelectorAll('.media-item');
  const mediaGrid = document.querySelector('.media-grid');
  const aoVivoContent = document.getElementById('content-postagens');

  // Remove active de todos
  filterBtns.forEach(b => b.classList.remove('active'));
  // Adiciona active no clicado
  if(btnElement) btnElement.classList.add('active');

  if (filter === 'todos') {
    if(aoVivoContent) aoVivoContent.style.display = 'none';
    if(mediaGrid) mediaGrid.style.display = 'grid';
    mediaItems.forEach(item => item.style.display = 'block');
  } else if (filter === 'fotos') {
    if(aoVivoContent) aoVivoContent.style.display = 'none';
    if(mediaGrid) mediaGrid.style.display = 'grid';
    mediaItems.forEach(item => {
      if (item.classList.contains('is-photo')) item.style.display = 'block';
      else item.style.display = 'none';
    });
  } else if (filter === 'vídeos' || filter === 'videos') {
    if(aoVivoContent) aoVivoContent.style.display = 'none';
    if(mediaGrid) mediaGrid.style.display = 'grid';
    mediaItems.forEach(item => {
      if (item.classList.contains('is-video')) item.style.display = 'block';
      else item.style.display = 'none';
    });
  } else if (filter === 'ao vivo') {
    if(mediaGrid) mediaGrid.style.display = 'none';
    if(aoVivoContent) aoVivoContent.style.display = 'block';
  }
};
