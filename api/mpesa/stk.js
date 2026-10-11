export default async function handler(req,res){
 res.setHeader('Access-Control-Allow-Origin','*');
 if(req.method==='OPTIONS') return res.status(200).end();
 try{
  let {phone, amount} = req.body;
  amount = parseInt(amount)||20;
  let p = (phone+'').replace(/[^0-9]/g,'');
  if(p.startsWith('0')) p='254'+p.substring(1);
  if(p.startsWith('7') && p.length==9) p='254'+p;

  const shortcode="1333254", till="1803135";
  const passkey=process.env.MPESA_PASSKEY;
  const key=process.env.MPESA_CONSUMER_KEY;
  const secret=process.env.MPESA_CONSUMER_SECRET;
  
  if(!passkey) return res.status(500).json({error:'MPESA_PASSKEY missing in Vercel Env'});
  if(!key) return res.status(500).json({error:'MPESA_CONSUMER_KEY missing'});

  const timestamp=new Date().toISOString().replace(/[^0-9]/g,'').slice(0,14);
  const password=Buffer.from(shortcode+passkey+timestamp).toString('base64');
  const auth=Buffer.from(key+':'+secret).toString('base64');
  
  const tokenRes=await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',{headers:{Authorization:'Basic '+auth}});
  const tokenData=await tokenRes.json();
  if(!tokenData.access_token) return res.status(500).json({error:'Token failed',data:tokenData});

  const payload={
    BusinessShortCode:shortcode, Password:password, Timestamp:timestamp,
    TransactionType:"CustomerBuyGoodsOnline", Amount:amount,
    PartyA:p, PartyB:till, PhoneNumber:p,
    CallBackURL:"https://bashiri-app.vercel.app/api/mpesa/callback",
    AccountReference:"HOT DIGITS", TransactionDesc:"Deposit"
  };
  const stkRes=await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',{method:'POST',headers:{Authorization:'Bearer '+tokenData.access_token,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const stkData=await stkRes.json();
  return res.status(200).json(stkData);
 }catch(e){ return res.status(500).json({error:e.message, stack:e.stack}); }
}
