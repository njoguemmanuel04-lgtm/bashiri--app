export default async function handler(req, res) {
  console.log('M-PESA CALLBACK:', JSON.stringify(req.body));
  // Here you will update Supabase / credit user balance
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
