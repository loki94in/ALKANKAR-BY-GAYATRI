module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USER || 'manhattan';
  const adminPass = process.env.ADMIN_PASS || 'manhattan';

  if (username === adminUser && password === adminPass) {
    return res.status(200).json({ status: 'success', token: 'authenticated' });
  } else {
    return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
  }
};
