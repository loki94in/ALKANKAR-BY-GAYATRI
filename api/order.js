module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sheetUrl = process.env.GOOGLE_SHEET_URL;
  if (!sheetUrl) {
    console.error('GOOGLE_SHEET_URL environment variable is not configured');
    return res.status(500).json({ status: 'error', message: 'Server configuration error: GOOGLE_SHEET_URL is missing' });
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
      responseData = { status: 'success', message: 'Order forwarded successfully' };
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error forwarding order:', error);
    return res.status(500).json({ status: 'error', message: error.toString() });
  }
};
