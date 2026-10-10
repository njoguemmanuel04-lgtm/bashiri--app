import { createClient } from '@supabase/supabase-js'
const supa = createClient(process.env.SUPA_URL, process.env.SUPA_KEY)

export default async function handler(req,res){
  const data = req.body.Body.stkCallback;
  const checkoutId = data.CheckoutRequestID;
  if(data.ResultCode === 0){
    const amount = data.CallbackMetadata.Item.find(i=>i.Name==='Amount').Value;
    const code = data.CallbackMetadata.Item.find(i=>i.Name==='MpesaReceiptNumber').Value;
    await supa.from('mpesa_payments').insert([{checkout_id: checkoutId, amount, code, status: 'paid'}]);
  }
  res.json({ResultCode:0});
}
