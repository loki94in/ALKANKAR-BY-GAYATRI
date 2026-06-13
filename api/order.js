const crypto = require('crypto');
const db = require('./db');

function isAdmin(req) {
  const token = req.headers['x-admin-token'] || '';
  return token === 'authenticated';
}

module.exports = async (req, res) => {
  const method = req.method;

  // GET and PUT require Admin access
  if (method === 'GET' || method === 'PUT') {
    if (!isAdmin(req)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Admin access required' });
    }
  }

  if (method === 'GET') {
    const orders = db.readData('orders.json', []);
    return res.status(200).json(orders);
  }

  if (method === 'PUT') {
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ status: 'error', message: 'Missing order ID or status' });
    }

    const orders = db.readData('orders.json', []);
    const idx = orders.findIndex(x => x.id === id);

    if (idx >= 0) {
      orders[idx].status = status;
      db.writeData('orders.json', orders);
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

    // Save order locally first
    const orders = db.readData('orders.json', []);
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
    db.writeData('orders.json', orders);

    const sheetUrl = process.env.GOOGLE_SHEET_URL;
    if (!sheetUrl) {
      console.warn('GOOGLE_SHEET_URL is not configured; order saved locally only.');
      return res.status(200).json({ 
        status: 'success', 
        message: 'Order recorded locally on server (Google Sheet sync skipped)', 
        order: newOrder 
      });
    }

    try {
      const response = await fetch(sheetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });

      let responseData = {};
      try {
        const text = await response.text();
        responseData = JSON.parse(text);
      } catch (e) {
        responseData = { status: 'success', message: 'Order forwarded successfully to Google Sheets' };
      }

      return res.status(200).json({
        ...responseData,
        order: newOrder
      });
    } catch (error) {
      console.error('Error forwarding order to Google Sheets:', error);
      // Even if Google Sheets fails, we successfully saved it locally, so we return success with a warning
      return res.status(200).json({ 
        status: 'success', 
        message: 'Order saved locally; failed to sync with Google Sheets: ' + error.toString(),
        order: newOrder
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
