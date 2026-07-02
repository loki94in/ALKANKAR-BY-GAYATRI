const db = require('./db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;
  const defaultSettings = {
    admin_user: process.env.ADMIN_USER || 'manhattan',
    admin_pass: process.env.ADMIN_PASS || 'manhattan',
    instagram_handle: process.env.INSTAGRAM_HANDLE || 'alankar_by_gayatri',
    whatsapp_number: process.env.WHATSAPP_NUMBER || ''
  };

  const settings = await db.readData('settings.json', defaultSettings);
  const adminUser = settings.admin_user;
  const adminPass = settings.admin_pass;

  if (username === adminUser && password === adminPass) {
    return res.status(200).json({ status: 'success', token: 'authenticated' });
  } else {
    return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
  }
};
