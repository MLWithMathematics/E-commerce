// Shiprocket token cache (module-level singleton — lives for the process lifetime)
let cachedToken = null;
let tokenExpiry  = 0;

async function getShiprocketToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      email:    process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });
  const data = await res.json();
  cachedToken  = data.token;
  tokenExpiry  = Date.now() + 23 * 60 * 60 * 1000; // 23 hours
  return cachedToken;
}

export const getShippingEstimate = async (req, res) => {
  const { pincode } = req.query;
  if (!pincode || pincode.length !== 6)
    return res.status(400).json({ message: 'Valid 6-digit pincode required' });

  if (!process.env.SHIPROCKET_EMAIL)
    return res.json({ etd: 'N/A — Shiprocket not configured', courier: '' });

  try {
    const token  = await getShiprocketToken();
    const estRes = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${process.env.WAREHOUSE_PIN}&delivery_postcode=${pincode}&weight=0.5&cod=0`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await estRes.json();
    const best = data.data?.available_courier_companies?.[0];
    res.json({ etd: best?.etd || 'N/A', courier: best?.courier_name || '' });
  } catch (err) {
    res.status(500).json({ message: 'Shiprocket error', error: err.message });
  }
};
