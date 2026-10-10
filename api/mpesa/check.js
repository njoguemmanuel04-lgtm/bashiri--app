import { createClient } from '@supabase/supabase-js'

const supa = createClient(
  process.env.SUPA_URL || 'https://hkhqbtyyqgvaktamilxs.supabase.co',
  process.env.SUPA_KEY || process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req,res){
  const { CheckoutRequestID } = req.query
  if(!CheckoutRequestID) return res.status(400).json({paid:false})

  const { data } = await supa.from('mpesa_payments')
    .select('*')
    .eq('checkout_id', CheckoutRequestID)
    .single()

  if(data && data.status === 'paid'){
    return res.json({paid:true, amount: data.amount, code: data.mpesa_code})
  } else {
    return res.json({paid:false})
  }
}
