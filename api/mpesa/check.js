global.mpesaPayments = global.mpesaPayments || {};

export default async function handler(req, res) {
  const { CheckoutRequestID } = req.query;
  if (!CheckoutRequestID) return res.status(400).json({ error: 'Missing ID' });
  const data = global.mpesaPayments[CheckoutRequestID];
  if (!data) return res.status(200).json({ paid: false, waiting: true });
  return res.status(200).json(data);
}
