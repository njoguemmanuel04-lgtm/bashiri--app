export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});
  
  const { phone, amount } = req.body;
  const shortcode = process.env.MPESA_SHORTCODE; // 1803135
  const passkey = process.env.MPESA_PASSKEY;
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');
  
  try {
    // 1. Get Token
    const tokenRes = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: 'Basic ' + Buffer.from(consumerKey + ':' + consumerSecret).toString('base64') }
    });
    const { access_token } = await tokenRes.json();
    
    // 2. STK Push
    const stkRes = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerBuyGoodsOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: `https://${req.headers.host}/api/mpesa/callback`,
        AccountReference: 'HOT DIGITS',
        TransactionDesc: 'Deposit'
      })
    });
    const data = await stkRes.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
