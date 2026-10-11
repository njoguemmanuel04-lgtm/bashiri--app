import { createClient } from '@supabase/supabase-js';
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

export default async function handler(req,res){
 res.setHeader('Access-Control-Allow-Origin','*');
 if(req.method==='OPTIONS') return res.status(200).end();
 if(req.method!=='POST') return res.status(405).json({error:'POST only'});
 try{
  let {phone, amount} = req.body;
  amount = parseInt(amount)||20;
  let p = (phone+'').replace(/[^0-9]/g,'');
  if(p.startsWith('0')) p='254'+p.substring(1);
  if(p.startsWith('7') && p.length==9) p='254'+p;
  if(!p.startsWith('254') || p.length!=12) return res.status(400).json({error:'Invalid phone 2547XXXXXXXX'});

  const shortcode = "1333254"; // YOUR Short Code from screenshot
  const till = "1803135";      // YOUR Till Number
  const passkey = process.env.MPESA_PASSKEY;
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  if(!passkey||!consumerKey||!consumerSecret) return res.status(500).json({error:'Missing MPESA env vars'});

  const timestamp = new Date().toISOString().replace(/[^0-9]/g,'').slice(0,14);
  const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

  // Token
  const auth = Buffer.from(consumerKey+':'+consumerSecret).toString('base64');
  const tokenRes = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',{headers:{Authorization:'Basic '+auth}});
  const tokenData = await tokenRes.json();
  if(!tokenData.access_token) return res.status(500).json({error:'Token failed', data:tokenData});

  // STK
  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerBuyGoodsOnline",
    Amount: amount,
    PartyA: p,
    PartyB: till,
    PhoneNumber: p,
    CallBackURL: "https://bashiri-app.vercel.app/api/mpesa/callback",
    AccountReference: "HOT DIGITS",
    TransactionDesc: "Deposit"
  };

  const stkRes = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',{method:'POST',headers:{Authorization:'Bearer '+tokenData.access_token,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const stkData = await stkRes.json();

  if(stkData.ResponseCode==='0'){
    await supa.from('deposits').insert([{checkout_id:stkData.CheckoutRequestID, phone:p, amount, status:'pending'}]);
  }
  return res.status(200).json(stkData);
 }catch(e){ return res.status(500).json({error:e.message}); }
}
