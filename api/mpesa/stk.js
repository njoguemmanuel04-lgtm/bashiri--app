export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'})
  const { phone, amount } = req.body
  try{
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64')
    const tokenRes = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` }
    })
    const tokenData = await tokenRes.json()
    if(!tokenData.access_token) return res.status(500).json({error: 'Token fail', data: tokenData})
    const token = tokenData.access_token

    const timestamp = new Date().toISOString().replace(/[^0-9]/g,'').slice(0,14)
    const password = Buffer.from(`1333254${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64')

    const stkRes = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processquery',{
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: 1333254,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerBuyGoodsOnline',
        Amount: Number(amount),
        PartyA: Number(phone),
        PartyB: 1803135,
        PhoneNumber: Number(phone),
        CallBackURL: process.env.MPESA_CALLBACK,
        AccountReference: '1803135',
        TransactionDesc: 'HOT DIGITS'
      })
    })
    const data = await stkRes.json()
    return res.json(data)
  }catch(e){ return res.status(500).json({error: e.message}) }
}
