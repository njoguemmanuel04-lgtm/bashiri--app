import axios from "axios";

export async function POST(req) {
  const { phone, amount } = await req.json(); // phone 2547..., amount 10
  
  // 1. Get Daraja Token
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");
  const tokenRes = await axios.get("https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
    headers: { Authorization: `Basic ${auth}` }
  });
  const token = tokenRes.data.access_token;

  // 2. STK Push
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0,14);
  const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString("base64");

  const stkRes = await axios.post("https://api.safaricom.co.ke/mpesa/stkpush/v1/processquery", {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerBuyGoodsOnline", // For Till linked shortcode use this
    Amount: amount,
    PartyA: phone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: process.env.MPESA_CALLBACK,
    AccountReference: "HOT DIGITS",
    TransactionDesc: "Deposit"
  }, { headers: { Authorization: `Bearer ${token}` } });

  // DO NOT CREDIT HERE! Just return CheckoutRequestID
  return Response.json({ 
    success: true, 
    CheckoutRequestID: stkRes.data.CheckoutRequestID,
    message: "Waiting for M-Pesa PIN..."
  });
}
