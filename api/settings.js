module.exports = (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    instagram_handle: process.env.INSTAGRAM_HANDLE || 'alankar_by_gayatri',
    whatsapp_number: process.env.WHATSAPP_NUMBER || ''
  });
};
