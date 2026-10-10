export default async function handler(req, res) {
  if (req.method!== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    let { phone, amount } = body;
    if (!phone ||!amount) return res.status(400).json({ error: 'phone and amount required' });

    phone = String(phone).replace(/[^0-9]/g,'');
    if (phone.startsWith('0')) phone = '254' + phone.substring(1);
    if (phone.startsWith('7') && phone.length==9) phone = '254'+phone;

    const shortcode = "1333254";
    const till = "1803135";
    const passkey = process.env.MPESA_PASSKEY;
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

    if (!passkey ||!consumerKey ||!consumerSecret) {
      return res.status(500).json({ error: 'Missing Vercel ENV vars' });
    }

    // 1. Get token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenRes = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` }
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.status(500).json({ error: 'Token failed', details: tokenData });

    // 2. STK - TILL FIX
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g,'').slice(0,14);
    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

    const stkRes = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerBuyGoodsOnline",
        Amount: Number(amount),
        PartyA: phone,
        PartyB: till,
        PhoneNumber: phone,
        CallBackURL: `https://${req.headers.host}/api/mpesa/callback`,
        AccountReference: "HOT DIGITS",
        TransactionDesc: `Deposit Till ${till}`
      })
    });
    const stkData = await stkRes.json();
    console.log("STK RESULT", stkData);
    return res.status(200).json(stkData);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
