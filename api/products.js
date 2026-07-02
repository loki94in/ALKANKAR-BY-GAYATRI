const db = require('./db');

const DEFAULT_PRODUCTS = [
  {id:1,name:'Kundan Choker Set',category:'Necklaces',price:3800,origPrice:4500,stock:8,desc:'Exquisite kundan work on a traditional choker with matching earrings.',image:'',visible:true,featured:true},
  {id:2,name:'Meenakari Jhumkas',category:'Earrings',price:1250,origPrice:null,stock:15,desc:'Vibrant meenakari jhumka earrings with intricate enamel detailing.',image:'',visible:true,featured:false},
  {id:3,name:'Bridal Bangles Set',category:'Bangles',price:2800,origPrice:3200,stock:5,desc:'Gold-finish bridal bangles set of 12, perfect for ceremonies.',image:'',visible:true,featured:true},
  {id:4,name:'Temple Necklace',category:'Necklaces',price:5500,origPrice:null,stock:4,desc:'South Indian temple jewellery necklace with antique gold finish.',image:'',visible:true,featured:false},
  {id:5,name:'Maang Tikka',category:'Hair Accessories',price:980,origPrice:1200,stock:12,desc:'Elegant maang tikka with pearl and stone work.',image:'',visible:true,featured:false},
  {id:6,name:'Oxidised Haath Phool',category:'Bridal',price:1600,origPrice:null,stock:7,desc:'Oxidised silver finish haath phool with floral motifs.',image:'',visible:true,featured:false},
  {id:7,name:'Stone Rings Set',category:'Rings',price:650,origPrice:null,stock:20,desc:'Set of 3 stone-studded rings with adjustable bands.',image:'',visible:true,featured:false},
  {id:8,name:'Ghungroo Anklets',category:'Anklets',price:750,origPrice:900,stock:10,desc:'Traditional payal with brass ghungroo bells.',image:'',visible:true,featured:false},
];

function isAdmin(req) {
  return req.headers['x-admin-token'] === 'authenticated';
}

module.exports = async (req, res) => {
  const method = req.method;

  if (method === 'GET') {
    const products = await db.readData('products.json', DEFAULT_PRODUCTS);
    return res.status(200).json(products);
  }

  if (method === 'POST') {
    if (!isAdmin(req)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    const { id, name, category, price, origPrice, stock, desc, visible, featured, image } = req.body;
    const products = await db.readData('products.json', DEFAULT_PRODUCTS);

    if (id !== undefined && id !== null) {
      // Edit mode
      const idx = products.findIndex(x => x.id === parseInt(id));
      if (idx >= 0) {
        products[idx] = {
          id: parseInt(id),
          name,
          category,
          price: parseFloat(price),
          origPrice: origPrice ? parseFloat(origPrice) : null,
          stock: parseInt(stock) || 0,
          desc: desc || '',
          visible: visible !== false,
          featured: featured === true,
          image: image || ''
        };
        await db.writeData('products.json', products);
        return res.status(200).json({ status: 'success', message: 'Product updated' });
      } else {
        return res.status(404).json({ status: 'error', message: 'Product not found' });
      }
    } else {
      // Add mode
      const newId = products.length ? Math.max(...products.map(x => x.id)) + 1 : 1;
      products.push({
        id: newId,
        name,
        category,
        price: parseFloat(price),
        origPrice: origPrice ? parseFloat(origPrice) : null,
        stock: parseInt(stock) || 0,
        desc: desc || '',
        visible: visible !== false,
        featured: featured === true,
        image: image || ''
      });
      await db.writeData('products.json', products);
      return res.status(200).json({ status: 'success', message: 'Product added' });
    }
  }

  if (method === 'DELETE') {
    if (!isAdmin(req)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const pid = parseInt(urlParams.get('id'));

    if (isNaN(pid)) {
      return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
    }

    let products = await db.readData('products.json', DEFAULT_PRODUCTS);
    products = products.filter(x => x.id !== pid);
    await db.writeData('products.json', products);
    return res.status(200).json({ status: 'success', message: 'Product deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
