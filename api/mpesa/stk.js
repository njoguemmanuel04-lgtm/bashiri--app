export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'})
  const { phone, amount } = req.body
  if(!phone || !amount) return res.status(400).json({error:'phone and amount required'})

  try{
    // 1. Get token
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64')
    const tokenRes = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` }
    })
    const tokenData = await tokenRes.json()
    if(!tokenData.access_token) throw new Error('Token failed: '+JSON.stringify(tokenData))
    const token = tokenData.access_token

    // 2. Build password - USE TILL 1803135 for both
    const timestamp = new Date().toISOString().replace(/[^0-9]/g,'').slice(0,14)
    const password = Buffer.from(`1803135${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64')

    // 3. STK Push to TILL 1803135
    const stkRes = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processquery',{
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        BusinessShortCode: 1803135, // HARDCODED TILL - not env
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerBuyGoodsOnline',
        Amount: Number(amount),
        PartyA: Number(phone),
        PartyB: 1803135, // TILL - money goes here
        PhoneNumber: Number(phone),
        CallBackURL: process.env.MPESA_CALLBACK,
        AccountReference: 'HOT DIGITS',
        TransactionDesc: 'Deposit'
      })
    })
    const data = await stkRes.json()
    res.json(data)
  }catch(err){
    console.error(err)
    res.status(500).json({error: err.message})
  }
}
