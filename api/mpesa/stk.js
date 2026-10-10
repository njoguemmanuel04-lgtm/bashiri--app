import axios from 'axios'

export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'})
  const { phone, amount } = req.body
  if(!phone || !amount) return res.status(400).json({error:'phone and amount required'})

  try{
    // 1. Get token
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64')
    const tokenRes = await axios.get('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } })
    const token = tokenRes.data.access_token

    // 2. Build password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g,'').slice(0,14)
    const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64')

    // 3. STK Push to TILL 1803135
    const stkRes = await axios.post('https://api.safaricom.co.ke/mpesa/stkpush/v1/processquery',{
      BusinessShortCode: process.env.MPESA_SHORTCODE, // 1333254
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerBuyGoodsOnline',
      Amount: Number(amount),
      PartyA: Number(phone),
      PartyB: 1803135, // YOUR TILL - money goes straight here
      PhoneNumber: Number(phone),
      CallBackURL: process.env.MPESA_CALLBACK, // https://bashiri-app.vercel.app/api/mpesa/callback
      AccountReference: 'HOT DIGITS',
      TransactionDesc: 'Deposit'
    },{ headers: { Authorization: `Bearer ${token}` } })

    res.json(stkRes.data)
  }catch(err){
    console.error(err.response?.data || err.message)
    res.status(500).json(err.response?.data || {error: err.message})
  }
}
