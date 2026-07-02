const db = require('./db');

const DEFAULT_CATEGORIES = ['Necklaces','Earrings','Bangles','Rings','Bridal','Hair Accessories','Anklets'];

function isAdmin(req) {
  return req.headers['x-admin-token'] === 'authenticated';
}

module.exports = async (req, res) => {
  const method = req.method;

  if (method === 'GET') {
    const categories = await db.readData('categories.json', DEFAULT_CATEGORIES);
    return res.status(200).json(categories);
  }

  if (method === 'POST') {
    if (!isAdmin(req)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Category name is required' });
    }

    const categories = await db.readData('categories.json', DEFAULT_CATEGORIES);
    if (categories.includes(name)) {
      return res.status(400).json({ status: 'error', message: 'Category already exists' });
    }

    categories.push(name);
    await db.writeData('categories.json', categories);
    return res.status(200).json({ status: 'success', message: 'Category added' });
  }

  if (method === 'DELETE') {
    if (!isAdmin(req)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const name = urlParams.get('name');

    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Category name is required' });
    }

    let categories = await db.readData('categories.json', DEFAULT_CATEGORIES);
    categories = categories.filter(x => x !== name);
    await db.writeData('categories.json', categories);
    return res.status(200).json({ status: 'success', message: 'Category deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
