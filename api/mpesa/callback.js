import { createClient } from '@supabase/supabase-js';
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

export default async function handler(req,res){
 if(req.method!=='POST') return res.status(200).json({ok:true});
 try{
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const stk = body?.Body?.stkCallback;
  if(!stk) return res.status(200).json({ok:true});
  
  const CheckoutRequestID = stk.CheckoutRequestID;
  const ResultCode = stk.ResultCode;
  console.log('CALLBACK', CheckoutRequestID, ResultCode);

  if(ResultCode===0){
    const meta = stk.CallbackMetadata?.Item || [];
    const get = (n)=> meta.find(i=>i.Name===n)?.Value;
    const amount = parseInt(get('Amount'))||0;
    const mpesaCode = get('MpesaReceiptNumber');
    const phoneRaw = get('PhoneNumber');
    const phone = String(phoneRaw);

    // 1. Mark deposit PAID
    await supa.from('deposits').update({status:'paid', mpesa_code: mpesaCode, amount: amount}).eq('checkout_id', CheckoutRequestID);

    // 2. Credit user_balances
    if(phone && amount){
      const {data:balRow} = await supa.from('user_balances').select('balance').eq('phone', phone).maybeSingle();
      if(balRow){ 
        await supa.from('user_balances').update({balance: balRow.balance + amount}).eq('phone', phone); 
      } else { 
        await supa.from('user_balances').insert([{phone: phone, balance: amount}]); 
      }
      console.log('CREDITED', phone, amount);
    }
  } else {
    await supa.from('deposits').update({status:'failed'}).eq('checkout_id', CheckoutRequestID);
    console.log('FAILED', stk.ResultDesc);
  }
  return res.status(200).json({ok:true});
 }catch(e){ 
  console.log('callback error', e.message);
  return res.status(200).json({ok:true}); 
 }
}
