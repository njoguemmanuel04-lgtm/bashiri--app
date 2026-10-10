import { createClient } from '@supabase/supabase-js';
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  // Allow CORS for polling
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { CheckoutRequestID } = req.query;
  if(!CheckoutRequestID) return res.json({ paid: false });

  try{
    const { data, error } = await supa.from('deposits').select('*').eq('checkout_id', CheckoutRequestID).maybeSingle();
    
    if (error) {
      console.log('check error', error);
      return res.json({ paid: false });
    }
    
    if (!data) return res.json({ paid: false });
    
    // Found payment!
    return res.json({ paid: true, amount: data.amount, code: data.mpesa_code, phone: data.phone });
  }catch(e){
    console.log('check exception', e);
    return res.json({ paid: false });
  }
}
