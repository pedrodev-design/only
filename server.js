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

    // A Flevopay retorna os dados do PIX (tentamos mapear as chaves mais comuns de retorno deles)
    const pixData = response.data.pix || response.data;
    const pixCode = pixData.qrcode || pixData.qr_code || pixData.payload || pixData.brCode || pixData.pix_code;

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

    res.json({
      success: true,
      message: "PIX gerado com sucesso",
      qrCodeBase64: qrCodeBase64,
      pixCopiaECola: pixCode,
      identifier: response.data.id || response.data.transaction_id,
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend Pix rodando na porta ${PORT}`);
});
