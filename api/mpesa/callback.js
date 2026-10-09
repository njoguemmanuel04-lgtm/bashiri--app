export default async function handler(req, res) {
  console.log('CALLBACK', JSON.stringify(req.body));
  const data = req.body;
  try {
    const result = data?.Body?.stkCallback;
    if(result?.ResultCode === 0){
      const amount = result.CallbackMetadata.Item.find(i=>i.Name==='Amount')?.Value;
      const phone = result.CallbackMetadata.Item.find(i=>i.Name==='PhoneNumber')?.Value;
      // Credit to Supabase
      const { createClient } = await import('@supabase/supabase-js');
      const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      await supa.from('deposits').insert([{phone, amount, status:'completed', mpesa_code: result.CallbackMetadata.Item.find(i=>i.Name==='MpesaReceiptNumber')?.Value}]);
    }
  } catch(e){ console.log(e); }
  res.json({ResultCode:0, ResultDesc:'Accepted'});
}
