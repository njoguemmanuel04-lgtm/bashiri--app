// Simple memory store (Vercel will keep for few mins)
global.mpesaPayments = global.mpesaPayments || {};

export default async function handler(req, res) {
  try {
    console.log('CALLBACK', JSON.stringify(req.body));
    const body = req.body;
    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) return res.json({ ResultCode: 0, ResultDesc: "No callback" });

    const checkoutId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;

    if (resultCode === 0) {
      const items = stkCallback.CallbackMetadata?.Item || [];
      const get = (name) => items.find(i=>i.Name===name)?.Value;
      global.mpesaPayments[checkoutId] = {
        paid: true,
        amount: get('Amount'),
        code: get('MpesaReceiptNumber'),
        phone: get('PhoneNumber'),
        date: new Date().toISOString()
      };
    } else {
      global.mpesaPayments[checkoutId] = { paid: false, reason: stkCallback.ResultDesc };
    }
    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (e) {
    return res.json({ ResultCode: 0, ResultDesc: "Error" });
  }
}
