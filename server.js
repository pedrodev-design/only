require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const QRCode = require("qrcode");

const app = express();
app.use(cors());
app.use(express.json());
// Servir os arquivos estáticos (HTML, CSS, JS, Imagens) na raiz (localhost:3000)
app.use(express.static(__dirname));

// ==========================================
// CREDENCIAIS DA API SYNCPAY
// Carregadas de forma segura através do .env
// ==========================================
const SYNCPAY_PUBLIC_KEY = process.env.SYNCPAY_PUBLIC_KEY;
const SYNCPAY_PRIVATE_KEY = process.env.SYNCPAY_PRIVATE_KEY;

// Guarda o token de acesso em memória para não gerar um novo a cada requisição (performance)
let syncPayToken = null;

async function getSyncPayToken() {
  if (syncPayToken) return syncPayToken;

  try {
    const response = await axios.post(
      "https://api.syncpayments.com.br/api/partner/v1/auth-token",
      {
        client_id: SYNCPAY_PUBLIC_KEY,
        client_secret: SYNCPAY_PRIVATE_KEY,
      },
    );

    syncPayToken =
      response.data.token || response.data.access_token || response.data;
    if (typeof syncPayToken === "object") {
      // Fallback in case token is inside another property
      syncPayToken = syncPayToken.access_token || syncPayToken.token;
    }
    return syncPayToken;
  } catch (error) {
    console.error(
      "Erro ao gerar token SyncPay:",
      error.response ? error.response.data : error.message,
    );
    throw new Error("Falha na autenticação da SyncPay");
  }
}

app.post("/api/pay", async (req, res) => {
  const { name, cpf, email, phone, value, title } = req.body;

  try {
    const pixValue = parseFloat(value.replace(",", "."));
    console.log(
      `[SyncPay PIX] Solicitando Cash-in para ${name}. Valor: R$ ${pixValue} - Produto: ${title}`,
    );

    // 1. Pega o token de autenticação
    const token = await getSyncPayToken();

    // 2. Chamada REAL para a API da SyncPay (usando dados do frontend)
    const response = await axios.post(
      "https://api.syncpayments.com.br/api/partner/v1/cash-in",
      {
        amount: pixValue,
        description: title || "Mimo para Marcy Chan",
        client: {
          name: name,
          cpf: cpf ? cpf.replace(/\D/g, "") : "", // Envia apenas números
          email: email,
          phone: phone ? phone.replace(/\D/g, "") : "", // Envia apenas números
        },
      },
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const pixCode = response.data.pix_code;

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
      identifier: response.data.identifier,
    });
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Se o token estiver expirado, apagamos da memória para renovar no próximo clique
      syncPayToken = null;
    }

    console.error(
      "Erro ao conectar com a SyncPay:",
      error.response ? error.response.data : error.message,
    );
    res.status(500).json({
      success: false,
      message:
        error.response?.data?.message ||
        "Erro ao gerar o PIX. Verifique os dados digitados.",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend Pix rodando na porta ${PORT}`);
});
