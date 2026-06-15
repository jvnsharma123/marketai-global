export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { amount, currency = 'INR', plan } = req.body;

  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    const credentials = Buffer.from(`${key_id}:${key_secret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        amount: amount * 100, // Razorpay needs amount in paise
        currency,
        receipt: `receipt_${plan}_${Date.now()}`,
        notes: { plan }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Razorpay error:', err);
      return res.status(500).json({ error: 'Failed to create order', details: err });
    }

    const order = await response.json();
    return res.status(200).json(order);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}
