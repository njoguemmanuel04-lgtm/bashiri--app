export default async function handler(req,res){
 res.setHeader('Access-Control-Allow-Origin','*');
 const {CheckoutRequestID} = req.query;
 if(!CheckoutRequestID) return res.status(200).json({paid:false});
 try{
  const SUPA_URL=process.env.SUPABASE_URL;
  const SUPA_KEY=process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
  const r = await fetch(`${SUPA_URL}/rest/v1/deposits?checkout_id=eq.${CheckoutID}&select=*`,{headers:{'apikey':SUPA_KEY,'Authorization':`Bearer ${SUPA_KEY}`}});
  const data = await r.json();
  const row = data?.[0];
  if(row && row.status==='paid' && row.mpesa_code){
    return res.status(200).json({paid:true, amount:row.amount, code:row.mpesa_code, phone:row.phone});
  }
  return res.status(200).json({paid:false});
 }catch(e){ return res.status(200).json({paid:false}); }
}
