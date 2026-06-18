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
// CREDENCIAIS DA API PAYSYNC
// Carregadas de forma segura através do .env
// ==========================================
const PAYSYNC_KEY = process.env.PAYSYNC_KEY;

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

app.post("/api/pay", async (req, res) => {
  const { name, cpf, email, phone, value, title } = req.body;

  try {
    const pixValue = parseFloat(value.replace(",", "."));
    const valueCents = Math.round(pixValue * 100);
    
    console.log(
      `[PaySync PIX] Solicitando cobrança para ${name}. Valor: R$ ${pixValue} (${valueCents} cents) - Produto: ${title}`,
    );

    // Gerar email aleatório
    const randomNum = Math.floor(Math.random() * 999999);
    const fakeEmail = `cliente${randomNum}@checkout.com`;

    // Chamada REAL para a API da PaySync
    const response = await axios.post(
      "https://api.usepaysync.com/v1/charges",
      {
        valueCents: valueCents,
        description: title || "Acesso VIP",
        customer: {
          name: "Visitante Premium",
          email: fakeEmail
        }
      },
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${PAYSYNC_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const pixCode = response.data.pix.brCode;

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
      identifier: response.data.paymentId,
    });
  } catch (error) {
    console.error(
      "Erro ao conectar com a PaySync:",
      error.response ? error.response.data : error.message,
    );
    res.status(500).json({
      success: false,
      message:
        error.response?.data?.error ||
        "Erro ao gerar o PIX. Verifique os dados digitados.",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend Pix rodando na porta ${PORT}`);
});
