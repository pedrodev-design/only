const API_URL = "https://only-ivf0.onrender.com";

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
function openPaymentModal(title, defaultPrice) {
  const modal = document.getElementById("paymentModal");
  const modalTitle = document.getElementById("modalTitle");
  const priceInput = document.getElementById("buyerValue");
  const mimoPresets = document.getElementById("mimoPresets");

  modalTitle.textContent = title;

  if (defaultPrice) {
    priceInput.value = defaultPrice;
    mimoPresets.style.display = "none";
  } else {
    priceInput.value = "";
    mimoPresets.style.display = "flex";
  }

  modal.classList.add("active");
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
  hideModalError();

  const name = document.getElementById("buyerName").value.trim();
  const cpf = document.getElementById("buyerCpf").value.trim();
  const email = document.getElementById("buyerEmail").value.trim();
  const value = document.getElementById("buyerValue").value.trim();
  const title = document.getElementById("modalTitle").textContent;
  const btn = document.querySelector(".modal-submit-btn");

  if (!name || !email || !value) {
    showModalError("Por favor, preencha todos os campos corretamente.");
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
      body: JSON.stringify({ name, cpf, email, value, title }),
    });

    const data = await response.json();

    if (data.success) {
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
  const pixText = document.getElementById("pixCopiaEColaText");
  pixText.select();
  pixText.setSelectionRange(0, 99999);
  document.execCommand("copy");

  const copyBtn = document.getElementById("copyPixBtn");
  copyBtn.innerHTML = "Copiado!";
  setTimeout(() => {
    copyBtn.innerHTML = "Copiar";
  }, 2000);
}

function closePaymentModal() {
  const modal = document.getElementById("paymentModal");
  modal.classList.remove("active");

  // Reseta o modal de volta para o estado de formulário
  setTimeout(() => {
    document.getElementById("modalForm").style.display = "block";
    document.getElementById("modalPix").style.display = "none";
    document.getElementById("buyerValue").value = "";
    document.getElementById("buyerName").value = "";
    document.getElementById("buyerCpf").value = "";
    document.getElementById("buyerEmail").value = "";
    document.getElementById("mimoPresets").style.display = "none";
    hideModalError();
  }, 300);
}

// ==========================
// Máscaras de Input
// ==========================
document.getElementById("buyerCpf").addEventListener("input", function (e) {
  let value = e.target.value.replace(/\D/g, "");
  if (value.length > 11) value = value.slice(0, 11);
  if (value.length > 9) {
    value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, "$1.$2.$3-$4");
  } else if (value.length > 6) {
    value = value.replace(/^(\d{3})(\d{3})(\d{1,3}).*/, "$1.$2.$3");
  } else if (value.length > 3) {
    value = value.replace(/^(\d{3})(\d{1,3}).*/, "$1.$2");
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
