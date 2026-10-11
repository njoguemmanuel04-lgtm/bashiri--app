import { createClient } from '@supabase/supabase-js';
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
export default async function handler(req,res){
 res.setHeader('Access-Control-Allow-Origin','*');
 const {CheckoutRequestID} = req.query;
 if(!CheckoutRequestID) return res.status(200).json({paid:false});
 try{
  const {data} = await supa.from('deposits').select('*').eq('checkout_id',CheckoutRequestID).maybeSingle();
  if(!data) return res.status(200).json({paid:false});
  if(data.status==='paid' && data.mpesa_code){
    return res.status(200).json({paid:true, amount:data.amount, code:data.mpesa_code, phone:data.phone});
  }
  return res.status(200).json({paid:false});
 }catch(e){ return res.status(200).json({paid:false}); }
}
