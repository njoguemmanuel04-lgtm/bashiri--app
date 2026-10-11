import { createClient } from '@supabase/supabase-js';
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
export default async function handler(req,res){
 if(req.method!=='POST') return res.status(200).json({ok:true});
 try{
  const body = req.body;
  const stk = body?.Body?.stkCallback;
  if(!stk) return res.status(200).json({ok:true});
  const CheckoutRequestID = stk.CheckoutRequestID;
  const ResultCode = stk.ResultCode;
  if(ResultCode===0){
    const meta = stk.CallbackMetadata?.Item || [];
    const get = (n)=> meta.find(i=>i.Name===n)?.Value;
    const amount = get('Amount');
    const mpesaCode = get('MpesaReceiptNumber');
    const phone = get('PhoneNumber');
    await supa.from('deposits').update({status:'paid', mpesa_code:mpesaCode}).eq('checkout_id', CheckoutRequestID);
    if(phone && amount){
      const p = String(phone);
      const {data:balRow} = await supa.from('user_balances').select('balance').eq('phone',p).maybeSingle();
      if(balRow){ await supa.from('user_balances').update({balance:balRow.balance+amount}).eq('phone',p); }
      else { await supa.from('user_balances').insert([{phone:p, balance:amount}]); }
    }
  } else {
    await supa.from('deposits').update({status:'failed'}).eq('checkout_id', CheckoutRequestID);
  }
  return res.status(200).json({ok:true});
 }catch(e){ return res.status(200).json({ok:true}); }
}
