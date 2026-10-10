import { createClient } from '@supabase/supabase-js';
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    const stk = req.body?.Body?.stkCallback;
    if (!stk) return res.json({ ResultCode: 0, ResultDesc: "ok" });
    
    const checkoutId = stk.CheckoutRequestID;
    const resultCode = stk.ResultCode;

    // Failed transaction
    if (resultCode !== 0) {
      console.log('STK FAILED', checkoutId, stk.ResultDesc);
      return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const items = stk.CallbackMetadata?.Item || [];
    const get = (n) => items.find(i=>i.Name===n)?.Value;
    
    const amount = parseInt(get('Amount')||0);
    const mpesaCode = get('MpesaReceiptNumber');
    let phone = String(get('PhoneNumber')||'').replace(/[^0-9]/g,'');
    if(phone.startsWith('0')) phone='254'+phone.substring(1);

    console.log('PAID CALLBACK', phone, amount, mpesaCode, checkoutId);

    // 1. Save to deposits log
    await supa.from('deposits').insert([{
      checkout_id: checkoutId,
      amount: amount,
      mpesa_code: mpesaCode,
      phone: phone,
      status: 'paid'
    }]);

    // 2. UPDATE USER BALANCE - THIS WAS MISSING!
    // Get current balance
    const {data: existing} = await supa.from('user_balances').select('balance').eq('phone', phone).single();
    const currentBal = existing?.balance || 0;
    const newBal = currentBal + amount;

    await supa.from('user_balances').upsert({
      phone: phone,
      balance: newBal,
      updated_at: new Date().toISOString()
    }, {onConflict:'phone'});

    console.log(`Balance updated ${phone}: ${currentBal} -> ${newBal}`);

    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (e) {
    console.log('callback error', e);
    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
