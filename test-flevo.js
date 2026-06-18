const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function testFlevopay() {
  const FLEVOPAY_PUBLIC_KEY = process.env.FLEVOPAY_PUBLIC_KEY;
  const FLEVOPAY_SECRET_KEY = process.env.FLEVOPAY_SECRET_KEY;
  const authHeader = "Basic " + Buffer.from(`${FLEVOPAY_PUBLIC_KEY}:${FLEVOPAY_SECRET_KEY}`).toString("base64");

  try {
    const payload = {
        amount: 1490,
        payment_method: "pix",
        postback_url: "https://only-ivf0.onrender.com/webhook",
        customer: {
          name: "Visitante Premium",
          email: "cliente123@checkout.com",
          document: {
            type: "cpf",
            number: "12345678909"
          }
        },
        items: [
          {
            title: "Acesso VIP",
            unit_price: 1490,
            quantity: 1,
            tangible: false
          }
        ]
      };

    console.log("Sending payload:", JSON.stringify(payload, null, 2));

    const response = await axios.post(
      "https://api.flevopay.com/v1/payment-transaction/create",
      payload,
      {
        headers: {
          Accept: "application/json",
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Success:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error("Flevopay Error:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Connection Error:", error.message);
    }
  }
}

testFlevopay();
