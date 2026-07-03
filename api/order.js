const crypto = require('crypto');
const db = require('./db');

function isAdmin(req) {
  return (req.headers['x-admin-token'] || '') === 'authenticated';
}

module.exports = async (req, res) => {
  const method = req.method;

  if ((method === 'GET' || method === 'PUT') && !isAdmin(req)) {
    return res.status(403).json({ status: 'error', message: 'Forbidden: Admin access required' });
  }

  try {

  if (method === 'GET') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const orders = await db.readData('orders.json', []);
    return res.status(200).json(orders);
  }

  if (method === 'PUT') {
    const { id, status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ status: 'error', message: 'Missing order ID or status' });
    }
    const orders = await db.readData('orders.json', []);
    const idx = orders.findIndex(x => x.id === id);
    if (idx >= 0) {
      orders[idx].status = status;
      await db.writeData('orders.json', orders);
      return res.status(200).json({ status: 'success', message: 'Order status updated successfully', order: orders[idx] });
    } else {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }
  }

  if (method === 'POST') {
    const { name, phone, address, items, total } = req.body;
    if (!name || !phone || !address) {
      return res.status(400).json({ status: 'error', message: 'Missing required customer details' });
    }

    const orders = await db.readData('orders.json', []);
    const newOrder = {
      id: 'ord_' + crypto.randomBytes(4).toString('hex'),
      date: req.body.date || new Date().toISOString(),
      name,
      phone,
      address,
      items: items || '',
      total: parseFloat(total) || 0,
      status: 'Pending'
    };

    orders.push(newOrder);
    await db.writeData('orders.json', orders);

    const sheetUrl = process.env.GOOGLE_SHEET_URL;
    if (!sheetUrl) {
      return res.status(200).json({ status: 'success', message: 'Order recorded (Google Sheet sync skipped)', order: newOrder });
    }

    try {
      const response = await fetch(sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      let responseData = {};
      try {
        responseData = JSON.parse(await response.text());
      } catch (e) {
        responseData = { status: 'success', message: 'Order forwarded to Google Sheets' };
      }
      return res.status(200).json({ ...responseData, order: newOrder });
    } catch (error) {
      return res.status(200).json({
        status: 'success',
        message: 'Order saved; Google Sheets sync failed: ' + error.toString(),
        order: newOrder
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('order handler error:', err);
    return res.status(500).json({ status: 'error', message: 'Storage error: ' + err.message });
  }
};
