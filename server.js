require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const axios   = require("axios");
const QRCode  = require("qrcode");
const fs      = require("fs");
const path    = require("path");

const app = express();
app.use(cors());
app.use(express.json());
// Servir os arquivos estáticos (HTML, CSS, JS, Imagens) na raiz (localhost:3000)
app.use(express.static(__dirname));

// ==========================================
// TIKTOK EVENTS API
// ==========================================
const crypto = require("crypto");
const TIKTOK_ACCESS_TOKEN = "f2db4ecf9e3c5c2c9cc00dbacbb7207df6143999";
const TIKTOK_PIXEL_ID = "D8SJ8IJC77U5NRSHLLR0";

function hashData(data) {
  if (!data) return undefined;
  return crypto.createHash('sha256').update(data.toString().trim().toLowerCase()).digest('hex');
}

async function sendTikTokEvent(eventName, eventData, userData = {}) {
  try {
    const payload = {
      pixel_code: TIKTOK_PIXEL_ID,
      test_event_code: "TEST48725",
      data: [
        {
          event: eventName,
          event_time: Math.floor(Date.now() / 1000),
          user: {
            email: userData.email,
            phone: userData.phone,
            client_ip_address: userData.ip,
            client_user_agent: userData.userAgent
          },
          properties: eventData
        }
      ]
    };

    await axios.post("https://business-api.tiktok.com/open_api/v1.3/event/track/", payload, {
      headers: {
        "Access-Token": TIKTOK_ACCESS_TOKEN,
        "Content-Type": "application/json"
      }
    });
    console.log(`[TikTok Events API] Evento ${eventName} enviado com sucesso.`);
  } catch (err) {
    console.error(`[TikTok Events API] Erro ao enviar evento ${eventName}:`, err.response ? err.response.data : err.message);
  }
}

const pendingTransactions = new Map();

// ==========================================
// CREDENCIAIS DA API FLEVOPAY
// Carregadas de forma segura através do .env
// ==========================================
const FLEVOPAY_PUBLIC_KEY = process.env.FLEVOPAY_PUBLIC_KEY;
const FLEVOPAY_SECRET_KEY = process.env.FLEVOPAY_SECRET_KEY;

// ==========================================
// CONTADOR DE VISUALIZAÇÕES
// Salva em views.json no disco — persiste entre reinicializações
// ==========================================
const VIEWS_FILE = path.join(__dirname, 'views.json');

function readViews() {
  try {
    if (fs.existsSync(VIEWS_FILE)) {
      const data = JSON.parse(fs.readFileSync(VIEWS_FILE, 'utf8'));
      return typeof data.count === 'number' ? data.count : 0;
    }
  } catch (e) {}
  return 0;
}

function saveViews(count) {
  try { fs.writeFileSync(VIEWS_FILE, JSON.stringify({ count }), 'utf8'); } catch (e) {}
}

// GET /api/views — incrementa +1 e retorna o total
app.get('/api/views', (req, res) => {
  const newCount = readViews() + 1;
  saveViews(newCount);
  res.json({ count: newCount });
});

// Helper para gerar CPF válido para gateways que exigem
function generateCPF() {
  const rnd = (n) => Math.round(Math.random() * n);
  const mod = (dividendo, divisor) => Math.round(dividendo - (Math.floor(dividendo / divisor) * divisor));
  const n = Array(9).fill('').map(() => rnd(9));
  let d1 = n.reduce((total, number, index) => (total + (number * (10 - index))), 0);
  d1 = 11 - mod(d1, 11);
  if (d1 >= 10) d1 = 0;
  let d2 = (d1 * 2) + n.reduce((total, number, index) => (total + (number * (11 - index))), 0);
  d2 = 11 - mod(d2, 11);
  if (d2 >= 10) d2 = 0;
  return `${n.join('')}${d1}${d2}`;
}

app.post("/api/pay", async (req, res) => {
  const { name, cpf, email, phone, value, title } = req.body;

  try {
    const pixValue = parseFloat(value.replace(",", "."));
    const valueCents = Math.round(pixValue * 100);
    
    console.log(
      `[Flevopay PIX] Solicitando cobrança. Valor: R$ ${pixValue} (${valueCents} cents) - Produto: ${title}`,
    );

    // Gerar email e CPF aleatório para evitar bloqueios de validação do gateway
    const randomNum = Math.floor(Math.random() * 999999);
    const fakeEmail = `cliente${randomNum}@checkout.com`;
    const fakeCpf = generateCPF();

    const authHeader = "Basic " + Buffer.from(`${FLEVOPAY_PUBLIC_KEY}:${FLEVOPAY_SECRET_KEY}`).toString("base64");

    // Chamada REAL para a API da Flevopay
    const response = await axios.post(
      "https://api.flevopay.com/v1/payment-transaction/create",
      {
        amount: valueCents,
        payment_method: "pix",
        postback_url: "https://only-ivf0.onrender.com/webhook",
        customer: {
          name: "Visitante Premium",
          email: fakeEmail,
          phone: "55" + phone,
          document: {
            type: "cpf",
            number: fakeCpf
          }
        },
        items: [
          {
            title: title || "Acesso VIP",
            unit_price: valueCents,
            quantity: 1,
            tangible: false
          }
        ],
        metadata: {
          "provider_name": "Site Vendas"
        }
      },
      {
        headers: {
          Accept: "application/json",
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      },
    );

    // Flevopay response is wrapped in "data" property
    const responseBody = response.data.data || response.data;
    const pixData = responseBody.pix || responseBody;
    const pixCode = pixData.qr_code || pixData.qrcode || pixData.payload;

    if (!pixCode) {
      console.error("Payload retornado não continha o PIX:", response.data);
      throw new Error("API da Flevopay retornou sucesso, mas não enviou a chave PIX.");
    }

    // Gerar o QR Code em formato Base64 para o frontend
    const qrCodeBase64 = await QRCode.toDataURL(pixCode, {
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      width: 250,
    });

    const identifier = responseBody.id || responseBody.transaction_id;

    // Salvar transação para o webhook/status
    pendingTransactions.set(identifier, {
      value: pixValue,
      title: title || "Acesso VIP",
      email: email,
      phone: phone
    });

    // Enviar evento de InitiateCheckout para o TikTok
    sendTikTokEvent("InitiateCheckout", {
      value: pixValue,
      currency: "BRL",
      contents: [{ content_name: title || "Acesso VIP", price: pixValue, quantity: 1 }]
    }, {
      email: hashData(email),
      phone: hashData(phone),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: "PIX gerado com sucesso",
      qrCodeBase64: qrCodeBase64,
      pixCopiaECola: pixCode,
      identifier: identifier,
    });
  } catch (error) {
    console.error(
      "Erro ao conectar com a Flevopay:",
      error.response ? error.response.data : error.message,
    );
    res.status(500).json({
      success: false,
      message:
        error.response?.data?.message || error.response?.data?.error ||
        "Erro ao gerar o PIX na Flevopay. Verifique a integração.",
    });
  }
});

// Endpoint para consultar status do pagamento (Polling)
app.get("/api/status/:id", async (req, res) => {
  const transactionId = req.params.id;
  try {
    const authHeader = "Basic " + Buffer.from(`${FLEVOPAY_PUBLIC_KEY}:${FLEVOPAY_SECRET_KEY}`).toString("base64");
    
    const response = await axios.get(
      `https://api.flevopay.com/v1/payment-transaction/info/${transactionId}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: authHeader
        }
      }
    );
    
    // Status esperados geralmente: "paid", "approved", "completed"
    const status = response.data.status || "pending";
    const isPaid = status === "paid" || status === "approved" || status === "completed";
    
    if (isPaid && pendingTransactions.has(transactionId)) {
      const txData = pendingTransactions.get(transactionId);
      
      // Disparar evento de Purchase no TikTok
      sendTikTokEvent("Purchase", {
        value: txData.value,
        currency: "BRL",
        contents: [{ content_name: txData.title, price: txData.value, quantity: 1 }]
      }, {
        email: hashData(txData.email),
        phone: hashData(txData.phone),
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Remove para não enviar evento duplicado em futuros polls
      pendingTransactions.delete(transactionId);
    }

    res.json({
      success: true,
      paid: isPaid,
      status: status
    });
  } catch (error) {
    console.error("Erro ao consultar status:", error.response?.data || error.message);
    res.json({ success: false, paid: false, status: "error" });
  }
});

// Endpoint para testar a Flevopay e mostrar o erro no navegador
app.get("/api/debug-flevo", async (req, res) => {
  try {
    const fakeCpf = generateCPF();
    const authHeader = "Basic " + Buffer.from(`${FLEVOPAY_PUBLIC_KEY}:${FLEVOPAY_SECRET_KEY}`).toString("base64");
    
    const response = await axios.post(
      "https://api.flevopay.com/v1/payment-transaction/create",
      {
        amount: 1490,
        payment_method: "pix",
        postback_url: "https://only-ivf0.onrender.com/webhook",
        customer: {
          name: "Visitante Premium",
          email: "teste" + Date.now() + "@vip.com",
          phone: "11999999999",
          document: {
            type: "cpf",
            number: fakeCpf
          }
        },
        items: [
          {
            title: "Acesso VIP",
            unit_price: 1490,
            quantity: 1,
            tangible: false
          }
        ],
        metadata: {
          "provider_name": "Site Vendas"
        }
      },
      {
        headers: {
          Accept: "application/json",
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.json({ success: false, rawError: error.response ? error.response.data : error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend Pix rodando na porta ${PORT}`);
});
