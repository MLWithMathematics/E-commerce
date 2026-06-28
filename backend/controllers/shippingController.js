/* ── Shiprocket Logic (Commented out — requires KYC & API credentials) ──
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
*/

export const getShippingEstimate = async (req, res) => {
  const { pincode } = req.query;
  if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode))
    return res.status(400).json({ message: 'Valid 6-digit Indian pincode required' });

  /* ── Shiprocket Serviceability Logic ──
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
  */

  // ── Free India Post Public API Logic (No KYC required) ──
  try {
    const apiRes = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await apiRes.json();
    const info = data?.[0];

    if (!info || info.Status !== 'Success' || !info.PostOffice?.length) {
      return res.json({ error: 'Delivery not available to this pincode' });
    }

    const postOffice = info.PostOffice[0];
    const location = `${postOffice.District}, ${postOffice.State}`;

    res.json({
      etd: '3–5 Business Days',
      courier: `Standard Delivery (${location})`
    });
  } catch (err) {
    // Fallback in case postal API network request fails
    res.json({
      etd: '3–5 Business Days',
      courier: 'Standard Surface Delivery'
    });
  }
};

