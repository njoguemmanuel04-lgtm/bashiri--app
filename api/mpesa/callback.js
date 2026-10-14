module.exports = async function handler(req, res) {
 res.setHeader('Access-Control-Allow-Origin', '*');
 if (req.method === 'OPTIONS') return res.status(200).end();
 
 try {
  const body = req.body?.Body?.stkCallback || req.body;
  const CheckoutID = body.CheckoutRequestID;
  const ResultCode = Number(body.ResultCode);
  const items = body.CallbackMetadata?.Item || [];
  const get = (n) => items.find(i => i.Name === n)?.Value || null;
  
  let amount = get('Amount');
  let mpesaCode = get('MpesaReceiptNumber') || 'MANUAL';
  let phone = get('PhoneNumber');

  const SUPA_URL = process.env.SUPABASE_URL;
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!phone && CheckoutID) {
    const depRes = await fetch(`${SUPA_URL}/rest/v1/deposits?checkout_id=eq.${CheckoutID}&select=phone,amount`, {
      headers: {'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}`}
    });
    const depData = await depRes.json();
    if (depData && depData.length > 0) {
      phone = depData[0].phone;
      if (!amount) amount = depData[0].amount;
    }
  }

  if (ResultCode === 0 && CheckoutID) {
    await fetch(`${SUPA_URL}/rest/v1/deposits?checkout_id=eq.${CheckoutID}`, {
      method: 'PATCH',
      headers: {'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({status: 'paid', mpesa_code: mpesaCode, phone: phone?.toString()})
    });

    if (phone && amount) {
      const p = phone.toString();
      const amt = Number(amount);

      const balRes = await fetch(`${SUPA_URL}/rest/v1/user_balances?phone=eq.${p}`, {
        headers: {'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}`}
      });
      const balData = await balRes.json();

      if (!balData || balData.length === 0) {
        await fetch(`${SUPA_URL}/rest/v1/user_balances`, {
          method: 'POST',
          headers: {'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json'},
          body: JSON.stringify({phone: p, balance: amt})
        });
      } else {
        const currentBal = Number(balData[0].balance || 0);
        await fetch(`${SUPA_URL}/rest/v1/user_balances?phone=eq.${p}`, {
          method: 'PATCH',
          headers: {'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json'},
          body: JSON.stringify({balance: currentBal + amt})
        });
      }
    }
  } else if (CheckoutID) {
    await fetch(`${SUPA_URL}/rest/v1/deposits?checkout_id=eq.${CheckoutID}`, {
      method: 'PATCH',
      headers: {'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({status: 'failed'})
    });
  }
  return res.status(200).json({ok: true});
 } catch (e) { 
   console.error("Callback Error:", e.message);
   return res.status(200).json({ok: true}); 
 }
};
