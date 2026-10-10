import { createClient } from '@supabase/supabase-js';
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  const { CheckoutRequestID } = req.query;
  const { data } = await supa.from('deposits').select('*').eq('checkout_id', CheckoutRequestID).maybeSingle();
  if (!data) return res.json({ paid: false });
  return res.json({ paid: true, amount: data.amount, code: data.mpesa_code });
}
