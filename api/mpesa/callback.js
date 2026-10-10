import { createClient } from '@supabase/supabase-js';
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    const stk = req.body?.Body?.stkCallback;
    if (!stk) return res.json({ ResultCode: 0, ResultDesc: "ok" });
    
    const checkoutId = stk.CheckoutRequestID;
    const code = stk.ResultCode;

    if (code === 0) {
      const items = stk.CallbackMetadata?.Item || [];
      const get = (n) => items.find(i=>i.Name===n)?.Value;
      await supa.from('deposits').insert([{
        checkout_id: checkoutId,
        amount: get('Amount'),
        mpesa_code: get('MpesaReceiptNumber'),
        phone: String(get('PhoneNumber')),
        status: 'paid'
      }]);
    }
    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (e) {
    console.log(e);
    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
