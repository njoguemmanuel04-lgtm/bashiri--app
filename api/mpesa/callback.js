export async function POST(req) {
  const data = await req.json();
  const stk = data.Body.stkCallback;
  
  if(stk.ResultCode === 0) {
    const amount = stk.CallbackMetadata.Item.find(i=>i.Name==="Amount").Value;
    const phone = stk.CallbackMetadata.Item.find(i=>i.Name==="PhoneNumber").Value;
    // FIND USER BY PHONE AND CREDIT
    // await db.users.updateOne({phone}, {$inc: {balance: amount}})
    console.log(`CREDIT ${phone} with ${amount}`);
  }
  return Response.json({ ok: true });
}
