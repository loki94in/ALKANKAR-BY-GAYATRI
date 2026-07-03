const db = require('./db');
const crypto = require('crypto');

module.exports = async (req, res) => {
  const method = req.method;

  try {
  if (method === 'POST') {
    const cartItems = req.body; // Expects an array
    if (!Array.isArray(cartItems)) {
      return res.status(400).json({ status: 'error', message: 'Invalid cart data' });
    }

    const carts = await db.readData('carts.json', {});
    const cartId = 'cart_' + crypto.randomBytes(8).toString('hex');
    carts[cartId] = cartItems;
    await db.writeData('carts.json', carts);

    return res.status(200).json({ status: 'success', id: cartId });
  }

  if (method === 'GET') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const cartId = urlParams.get('id');

    if (!cartId) {
      return res.status(400).json({ status: 'error', message: 'Cart ID is required' });
    }

    const carts = await db.readData('carts.json', {});
    const cartData = carts[cartId];

    if (cartData) {
      return res.status(200).json(cartData);
    } else {
      return res.status(404).json({ status: 'error', message: 'Cart not found' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('carts handler error:', err);
    return res.status(500).json({ status: 'error', message: 'Storage error: ' + err.message });
  }
};

