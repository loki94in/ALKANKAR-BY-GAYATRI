const db = require('./db');

function isAdmin(req) {
  return req.headers['x-admin-token'] === 'authenticated';
}

module.exports = async (req, res) => {
  const method = req.method;
  const defaultSettings = {
    admin_user: process.env.ADMIN_USER || 'manhattan',
    admin_pass: process.env.ADMIN_PASS || 'manhattan',
    instagram_handle: process.env.INSTAGRAM_HANDLE || 'alankar_by_gayatri',
    whatsapp_number: process.env.WHATSAPP_NUMBER || ''
  };

  if (method === 'GET') {
    const settings = await db.readData('settings.json', defaultSettings);
    // Never expose credentials on GET
    return res.status(200).json({
      instagram_handle: settings.instagram_handle,
      whatsapp_number: settings.whatsapp_number
    });
  }

  if (method === 'POST') {
    if (!isAdmin(req)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    let settings = await db.readData('settings.json', defaultSettings);
    if (req.body.admin_user) settings.admin_user = req.body.admin_user;
    if (req.body.admin_pass) settings.admin_pass = req.body.admin_pass;
    if (req.body.instagram_handle !== undefined) settings.instagram_handle = req.body.instagram_handle;
    if (req.body.whatsapp_number !== undefined) settings.whatsapp_number = req.body.whatsapp_number;

    await db.writeData('settings.json', settings);
    return res.status(200).json({ status: 'success', message: 'Settings updated' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
