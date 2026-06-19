const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

function generateCPF() {
  const n = () => Math.floor(Math.random() * 9);
  let n1 = n(), n2 = n(), n3 = n(), n4 = n(), n5 = n(), n6 = n(), n7 = n(), n8 = n(), n9 = n();
  let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;
  let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;
  return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
}

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
          phone: "11999999999",
          document: {
            type: "cpf",
            number: generateCPF()
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
