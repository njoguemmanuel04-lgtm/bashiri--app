import { createClient } from '@supabase/supabase-js'

const supa = createClient(
  process.env.SUPA_URL || 'https://hkhqbtyyqgvaktamilxs.supabase.co',
  process.env.SUPA_KEY || process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req,res){
  try{
    console.log('CALLBACK:', JSON.stringify(req.body))
    const stk = req.body?.Body?.stkCallback
    if(!stk){ return res.json({ResultCode:0, ResultDesc:'No stk'}) }

    const checkoutId = stk.CheckoutRequestID
    const resultCode = stk.ResultCode

    if(resultCode === 0){
      const meta = stk.CallbackMetadata?.Item || []
      const amount = meta.find(i=>i.Name==='Amount')?.Value
      const code = meta.find(i=>i.Name==='MpesaReceiptNumber')?.Value
      const phone = meta.find(i=>i.Name==='PhoneNumber')?.Value

      // Save to cloud - this is what frontend polls
      await supa.from('mpesa_payments').insert([{
        checkout_id: checkoutId,
        amount: amount,
        mpesa_code: code,
        phone: String(phone),
        status: 'paid',
        raw: req.body
      }])
      console.log('PAID SAVED', checkoutId, amount, code)
    } else {
      // Save failed too
      await supa.from('mpesa_payments').insert([{
        checkout_id: checkoutId,
        status: 'failed',
        raw: req.body
      }])
    }

    res.json({ResultCode:0, ResultDesc:'Accepted'})
  }catch(e){
    console.error('callback error', e)
    res.json({ResultCode:0})
  }
}
