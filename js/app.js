// ============================================================
// DATA LAYER
// ============================================================
const LOGO_B64 = '';

let appSettings = {
  instagram_handle: 'alankar_by_gayatri',
  whatsapp_number: ''
};

const DEFAULT_CATEGORIES = ['Necklaces','Earrings','Bangles','Rings','Bridal','Hair Accessories','Anklets'];

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

let cachedProducts = [];
let cachedCategories = [];

function loadDataFromServer(callback) {
  Promise.all([
    fetch('/api/products').then(res => res.json()),
    fetch('/api/categories').then(res => res.json())
  ])
  .then(([products, categories]) => {
    cachedProducts = products;
    cachedCategories = categories;
    if (callback) callback();
  })
  .catch(err => {
    console.error('Failed to load data from server, falling back to local defaults:', err);
    cachedProducts = DEFAULT_PRODUCTS;
    cachedCategories = DEFAULT_CATEGORIES;
    if (callback) callback();
  });
}

function getData(key, def){try{const v=localStorage.getItem(key);return v?JSON.parse(v):def;}catch(e){return def;}}
function setData(key,val){localStorage.setItem(key,JSON.stringify(val));}

function getProducts(){return cachedProducts;}
function getCategories(){return cachedCategories;}
function getCart(){return getData('alg_cart',[]);}
function saveCart(c){setData('alg_cart',c);}
function getFavorites(){return getData('alg_favorites',[]);}
function saveFavorites(f){setData('alg_favorites',f);}
function toggleFavorite(pid){
  let favorites = getFavorites();
  const products = getProducts();
  const p = products.find(x => x.id === pid);
  if(!p) return;
  
  const idx = favorites.indexOf(pid);
  if(idx >= 0){
    favorites.splice(idx, 1);
    saveFavorites(favorites);
    showToast('Removed from favorites: ' + p.name, 'success');
  } else {
    favorites.push(pid);
    saveFavorites(favorites);
    showToast('Added to favorites: ' + p.name, 'success');
  }
  
  renderCategoryFilter();
  renderProducts();
}

// ============================================================
// LOGO INIT
// ============================================================
function initLogos(){
  const src='images/logo.jpg';
  ['headerLogo','heroLogo','footerLogo','loginLogo','adminLogo'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.src=src;
  });
}

// ============================================================
// CATALOG RENDER
// ============================================================
let currentCat = 'All';

function renderCategoryFilter(){
  const cats = getCategories();
  const all = ['All','Favorites',...cats];
  const wrap = document.getElementById('catFilter');
  wrap.innerHTML = all.map(c=>{
    const label = c==='Favorites'?'Favorites ♡':c;
    return `<button class="cat-btn${c===currentCat?' active':''}" onclick="filterCat('${c}')">${label}</button>`;
  }).join('');
}

function filterCat(cat){
  currentCat = cat;
  renderCategoryFilter();
  renderProducts();
}

function renderProducts(){
  const products = getProducts();
  const searchInput = document.getElementById('searchInput');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const favorites = getFavorites();

  const filtered = products.filter(p=>{
    if(!p.visible) return false;
    
    // Category / Favorites check
    if(currentCat==='Favorites'){
      if(!favorites.includes(p.id)) return false;
    } else if(currentCat!=='All' && p.category !== currentCat){
      return false;
    }
    
    // Search query check
    if(query){
      const nameMatch = p.name.toLowerCase().includes(query);
      const descMatch = (p.desc || '').toLowerCase().includes(query);
      const catMatch = p.category.toLowerCase().includes(query);
      if(!nameMatch && !descMatch && !catMatch) return false;
    }
    
    return true;
  });

  const grid = document.getElementById('productGrid');
  let heading = currentCat==='All'?'All Jewellery':(currentCat==='Favorites'?'My Favorites':currentCat);
  if(query) heading += ` (Search: "${query}")`;
  
  document.getElementById('catalogHeading').textContent = heading;
  document.getElementById('productCount').textContent = filtered.length + ' piece'+(filtered.length!==1?'s':'');

  if(!filtered.length){
    grid.innerHTML = '<div class="no-products" style="grid-column:1/-1">✦ No pieces found ✦</div>';
    return;
  }
  grid.innerHTML = filtered.map(p=>productCard(p)).join('');
}

function searchProducts(){
  renderProducts();
}

const EMOJI_MAP = {'Necklaces':'📿','Earrings':'💎','Bangles':'⭕','Rings':'💍','Bridal':'👑','Hair Accessories':'✨','Anklets':'🌸'};

function productCard(p){
  const img = p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` 
    : `<div class="product-img-placeholder">${EMOJI_MAP[p.category]||'✦'}</div>`;
  const badge = p.featured ? `<div class="product-badge">New</div>` : '';
  const origPrice = p.origPrice ? `<span class="original">₹${p.origPrice.toLocaleString('en-IN')}</span>` : '';
  
  const isFav = getFavorites().includes(p.id);
  const wishClass = isFav ? 'active' : '';
  const wishIcon = isFav ? '♥' : '♡';
  const wishTitle = isFav ? 'Remove from Favorites' : 'Add to Favorites';

  return `<div class="product-card">
    <div class="product-img-wrap">${img}${badge}</div>
    <div class="product-body">
      <div class="product-category">${p.category}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-price">₹${p.price.toLocaleString('en-IN')}${origPrice}</div>
    </div>
    <div class="product-actions">
      <button class="btn-cart" onclick="addToCart(${p.id})">Add to Cart</button>
      <button class="btn-wish ${wishClass}" onclick="toggleFavorite(${p.id})" title="${wishTitle}">${wishIcon}</button>
    </div>
  </div>`;
}

// ============================================================
// CART
// ============================================================
function addToCart(pid){
  const products = getProducts();
  const p = products.find(x=>x.id==pid);
  if(!p) return;
  let cart = getCart();
  const existing = cart.find(x=>x.id==pid);
  if(existing) existing.qty=(existing.qty||1)+1;
  else cart.push({id:pid,qty:1});
  saveCart(cart);
  updateCartCount();
  showToast('Added to cart: '+p.name,'success');
}

function updateCartCount(){
  const cart = getCart();
  const total = cart.reduce((s,x)=>s+(x.qty||1),0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = total;
  });
}

function openCart(){
  document.getElementById('cartPanel').classList.add('open');
  document.getElementById('cartOverlay').classList.add('active');
  renderCartPanel();
}
function closeCart(){
  document.getElementById('cartPanel').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('active');
}

function renderCartPanel(){
  const cart = getCart();
  const products = getProducts();
  const wrap = document.getElementById('cartItemsWrap');
  const footer = document.getElementById('cartFooter');
  if(!cart.length){
    wrap.innerHTML = '<div class="cart-empty">Your cart is empty<br><small style="font-size:0.7rem;color:var(--text-muted);letter-spacing:1px">Browse our collection and add pieces you love</small></div>';
    footer.style.display='none';
    return;
  }
  let total=0;
  let html='';
  cart.forEach(item=>{
    const p = products.find(x=>x.id==item.id);
    if(!p) return;
    const subtotal = p.price * (item.qty||1);
    total += subtotal;
    const imgEl = p.image ? `<img src="${p.image}" style="width:64px;height:64px;object-fit:cover;border-radius:5px;flex-shrink:0">` 
      : `<div class="cart-item-img">${EMOJI_MAP[p.category]||'✦'}</div>`;
    html += `<div class="cart-item">
      ${imgEl}
      <div class="cart-item-info">
        <div class="cart-item-name">${p.name}</div>
        <div class="cart-item-cat">${p.category}</div>
        <div class="cart-item-price">₹${subtotal.toLocaleString('en-IN')}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${p.id},-1)">−</button>
          <span class="qty-num">${item.qty||1}</span>
          <button class="qty-btn" onclick="changeQty(${p.id},1)">+</button>
          <button class="cart-item-remove" onclick="removeFromCart(${p.id})">✕ Remove</button>
        </div>
      </div>
    </div>`;
  });
  wrap.innerHTML = html;
  document.getElementById('cartTotal').textContent = '₹'+total.toLocaleString('en-IN');
  footer.style.display='block';
}

function changeQty(pid,delta){
  let cart=getCart();
  const item=cart.find(x=>x.id==pid);
  if(!item) return;
  item.qty=(item.qty||1)+delta;
  if(item.qty<1) cart=cart.filter(x=>x.id!=pid);
  saveCart(cart);
  updateCartCount();
  renderCartPanel();
}
function removeFromCart(pid){
  let cart=getCart().filter(x=>x.id!=pid);
  saveCart(cart);
  updateCartCount();
  renderCartPanel();
}

function shareCatalogLink(){
  const cart=getCart();
  if(!cart.length){
    showToast('Your cart is empty', 'error');
    return;
  }
  fetch('/api/carts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cart)
  })
  .then(res => res.json())
  .then(res => {
    if (res.status === 'success') {
      const url=window.location.href.split('?')[0]+'?cartId='+res.id;
      navigator.clipboard.writeText(url).then(()=>showToast('Link copied to clipboard!','success')).catch(()=>{
        const modal = document.createElement('div');
        modal.style = "position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:1000;display:flex;align-items:center;justify-content:center;";
        modal.innerHTML = `<div style="background:var(--bg3);padding:24px;border:1px solid var(--border);border-radius:8px;max-width:400px;text-align:center;">
          <h3 style="margin-bottom:12px;color:var(--gold);">Copy Shareable Link</h3>
          <input type="text" value="${url}" readonly style="width:100%;padding:8px;margin-bottom:16px;background:var(--bg2);color:var(--text);border:1px solid var(--border);border-radius:4px;">
          <button class="btn-save" onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>`;
        document.body.appendChild(modal);
      });
    } else {
      showToast('Failed to create shareable link', 'error');
    }
  })
  .catch(err => {
    console.error('Error sharing cart:', err);
    showToast('Failed to create shareable link', 'error');
  });
}

function shareOnWhatsApp(){
  const cart=getCart();
  if(!cart.length){
    showToast('Your cart is empty', 'error');
    return;
  }
  const products=getProducts();
  let msg='✨ *Alankar by Gayatri* — My Wishlist\n\n';
  let total=0;
  cart.forEach(c=>{
    const p=products.find(x=>x.id===c.id);
    if(p){
      msg+=`• ${p.name} — ₹${p.price.toLocaleString('en-IN')} x${c.qty||1}\n`;
      total+=p.price*(c.qty||1);
    }
  });
  msg+=`\n*Total: ₹${total.toLocaleString('en-IN')}*\n\n`;
  
  showToast('Generating shareable cart link...', 'info');
  
  fetch('/api/carts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cart)
  })
  .then(res => res.json())
  .then(res => {
    if (res.status === 'success') {
      const url = window.location.origin + window.location.pathname + '?cartId=' + res.id;
      msg += `🔗 View and edit this cart: ${url}\n\n`;
      msg += `📸 instagram.com/${getInstagramHandle()}`;
      const wa = getWhatsAppNumber().replace(/\D/g, '');
      const waUrl = wa ? `https://wa.me/${wa}?text=` : 'https://wa.me/?text=';
      window.open(waUrl + encodeURIComponent(msg), '_blank');
      showToast('Redirected to WhatsApp!', 'success');
    } else {
      throw new Error('API failure');
    }
  })
  .catch(err => {
    console.error('Error sharing cart on WhatsApp:', err);
    msg += `📸 instagram.com/${getInstagramHandle()}`;
    const wa = getWhatsAppNumber().replace(/\D/g, '');
    const waUrl = wa ? `https://wa.me/${wa}?text=` : 'https://wa.me/?text=';
    window.open(waUrl + encodeURIComponent(msg), '_blank');
  });
}

function enquireOnWhatsApp(){
  const cart=getCart();
  if(!cart.length){
    showToast('Your cart is empty', 'error');
    return;
  }
  const products=getProducts();
  let msg='🙏 Namaste! I am interested in the following pieces from Alankar by Gayatri:\n\n';
  let total=0;
  cart.forEach(c=>{
    const p=products.find(x=>x.id===c.id);
    if(p){
      msg+=`• ${p.name} — ₹${p.price.toLocaleString('en-IN')} (Qty: ${c.qty||1})\n`;
      total+=p.price*(c.qty||1);
    }
  });
  msg+=`\n*Approx Total: ₹${total.toLocaleString('en-IN')}*\n\n`;
  
  showToast('Generating shareable cart link...', 'info');
  
  fetch('/api/carts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cart)
  })
  .then(res => res.json())
  .then(res => {
    if (res.status === 'success') {
      const url = window.location.origin + window.location.pathname + '?cartId=' + res.id;
      msg += `🔗 View details here: ${url}\n\n`;
      msg += `Kindly share availability & payment details. Thank you!`;
      const wa = getWhatsAppNumber().replace(/\D/g, '');
      const waUrl = wa ? `https://wa.me/${wa}?text=` : 'https://wa.me/?text=';
      window.open(waUrl + encodeURIComponent(msg), '_blank');
      showToast('Redirected to WhatsApp!', 'success');
    } else {
      throw new Error('API failure');
    }
  })
  .catch(err => {
    console.error('Error sharing enquiry on WhatsApp:', err);
    msg += `Kindly share availability & payment details. Thank you!`;
    const wa = getWhatsAppNumber().replace(/\D/g, '');
    const waUrl = wa ? `https://wa.me/${wa}?text=` : 'https://wa.me/?text=';
    window.open(waUrl + encodeURIComponent(msg), '_blank');
  });
}

// ============================================================
// SHARED CART FROM URL
// ============================================================
function checkSharedCart(){
  const params = new URLSearchParams(window.location.search);
  const cartId = params.get('cartId');
  if(cartId){
    fetch(`/api/carts?id=${cartId}`)
    .then(res => res.json())
    .then(cartData => {
      if (Array.isArray(cartData)) {
        saveCart(cartData);
        updateCartCount();
        document.getElementById('sharedBanner').classList.add('active');
        setTimeout(()=>document.getElementById('sharedBanner').classList.remove('active'),5000);
        
        // Remove cartId from URL so refresh doesn't overwrite it again
        const url = new URL(window.location);
        url.searchParams.delete('cartId');
        window.history.replaceState({}, document.title, url.pathname + url.search);
      }
    })
    .catch(err => console.error('Failed to load shared cart:', err));
  }
}

// ============================================================
// ADMIN AUTH
// ============================================================

function triggerAdminHint(){
  showAdminLogin();
}
function showAdminLogin(){
  document.getElementById('adminLoginModal').classList.add('active');
  document.getElementById('loginUser').focus();
  document.getElementById('loginError').style.display='none';
  document.getElementById('loginUser').value='';
  document.getElementById('loginPass').value='';
}
function closeAdminLogin(){
  document.getElementById('adminLoginModal').classList.remove('active');
}
function doAdminLogin(){
  const u=document.getElementById('loginUser').value.trim();
  const p=document.getElementById('loginPass').value.trim();
  
  fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: u, password: p })
  })
  .then(res => res.json())
  .then(res => {
    if (res.status === 'success') {
      sessionStorage.setItem('alg_admin', '1');
      document.getElementById('adminLoginModal').classList.remove('active');
      switchToAdmin();
    } else {
      document.getElementById('loginError').style.display='block';
      document.getElementById('loginPass').value='';
    }
  })
  .catch(() => {
    document.getElementById('loginError').style.display='block';
    document.getElementById('loginPass').value='';
  });
}
document.getElementById('loginPass').addEventListener('keydown',e=>{if(e.key==='Enter')doAdminLogin();});
document.getElementById('loginUser').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('loginPass').focus();});
// ----- Admin settings helpers -----
function getInstagramHandle(){return appSettings.instagram_handle || 'alankar_by_gayatri';}
function getWhatsAppNumber(){return appSettings.whatsapp_number || '';}

function updateSocialLinks(){
  let insta = getInstagramHandle().trim();
  const wa = getWhatsAppNumber().replace(/\D/g, '');
  
  let instaUrl = '';
  if (insta.startsWith('http://') || insta.startsWith('https://')) {
    instaUrl = insta;
  } else if (insta.startsWith('instagram.com/') || insta.startsWith('www.instagram.com/')) {
    instaUrl = 'https://' + insta;
  } else {
    if (insta.startsWith('@')) {
      insta = insta.substring(1);
    }
    instaUrl = `https://www.instagram.com/${insta}`;
  }
  
  ['headerInstaLink', 'footerInstaLink'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.href = instaUrl;
  });
  
  const footerWA = document.getElementById('footerWALink');
  if(footerWA) {
    footerWA.href = wa ? `https://wa.me/${wa}?text=Namaste!%20I%20want%20to%20enquire%20about%20Alankar%20by%20Gayatri%20Jewellery.` : 'https://wa.me/?text=Check%20out%20Alankar%20by%20Gayatri%20Jewellery!';
  }
}

// UI for changing credentials and settings (Server-Side Env Managed)
async function showAdminSettings(){
  let currentSettings = { admin_user: '', admin_pass: '', instagram_handle: '', whatsapp_number: '' };
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      currentSettings = await res.json();
    }
  } catch(e) {}

  const html=`<div class="modal-box"><div class="modal-head"><h3>Admin Environment Configuration</h3><button class="modal-close" onclick="closeAdminSettings()">✕</button></div>`+
    `<div class="modal-body" style="line-height: 1.6;">`+
    `<div style="background:var(--crimson-dark);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px;font-size:0.85rem;color:var(--text-dim);">`+
      `<strong style="color:var(--gold);display:block;margin-bottom:6px;">🔒 Server-Side Security Active</strong>`+
      `Update your settings and credentials below. They are saved securely on the server.`+
    `</div>`+
    `<div class="form-row">`+
      `<label class="form-label">Admin Username</label>`+
      `<input type="text" id="set_admin_user" class="form-input" placeholder="Current username">`+
    `</div>`+
    `<div class="form-row">`+
      `<label class="form-label">Admin Password</label>`+
      `<input type="password" id="set_admin_pass" class="form-input" placeholder="Leave blank to keep current">`+
    `</div>`+
    `<div class="form-row">`+
      `<label class="form-label">Instagram Handle</label>`+
      `<input type="text" id="set_instagram_handle" class="form-input" value="${currentSettings.instagram_handle || ''}">`+
    `</div>`+
    `<div class="form-row">`+
      `<label class="form-label">WhatsApp Number</label>`+
      `<input type="text" id="set_whatsapp_number" class="form-input" value="${currentSettings.whatsapp_number || ''}">`+
    `</div>`+
    `</div>`+
    `<div class="modal-footer">`+
      `<button class="btn-save" onclick="saveAdminSettings()">Save Changes</button>`+
    `</div></div>`;
  const overlay=document.createElement('div');
  overlay.id='adminSettingsOverlay';
  overlay.style.position='fixed';overlay.style.inset='0';overlay.style.background='rgba(0,0,0,0.7)';overlay.style.zIndex='600';
  overlay.innerHTML=`<div class="admin-settings-modal" style="position:relative;max-width:500px;margin:100px auto;background:var(--bg3);padding:20px;border:1px solid var(--border);border-radius:8px">${html}</div>`;
  document.body.appendChild(overlay);
}

async function saveAdminSettings(){
  const admin_user = document.getElementById('set_admin_user').value.trim();
  const admin_pass = document.getElementById('set_admin_pass').value.trim();
  const instagram_handle = document.getElementById('set_instagram_handle').value.trim();
  const whatsapp_number = document.getElementById('set_whatsapp_number').value.trim();
  
  const payload = {};
  if(admin_user) payload.admin_user = admin_user;
  if(admin_pass) payload.admin_pass = admin_pass;
  payload.instagram_handle = instagram_handle;
  payload.whatsapp_number = whatsapp_number;

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': sessionStorage.getItem('alg_admin') || ''
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('Settings saved successfully');
      closeAdminSettings();
      // Reload settings
      fetchSettings();
    } else {
      const data = await res.json();
      showToast(data.message || 'Error saving settings', true);
    }
  } catch(e) {
    showToast('Error saving settings', true);
  }
}

function closeAdminSettings(){
  const el=document.getElementById('adminSettingsOverlay');
  if(el) el.remove();
}


function adminLogout(){
  sessionStorage.removeItem('alg_admin');
  switchToCatalog();
  showToast('Logged out successfully');
}

// ============================================================
// SECTION SWITCHING
// ============================================================
function switchToAdmin(){
  document.getElementById('customerSection').style.display='none';
  document.getElementById('adminSection').style.display='';
  document.getElementById('adminSection').classList.add('active');
  renderAdminDashboard();
  renderAdminProducts();
  renderAdminCategories();
  renderAdminOrders();
}
function switchToCatalog(){
  document.getElementById('adminSection').classList.remove('active');
  document.getElementById('adminSection').style.display='none';
  document.getElementById('customerSection').style.display='block';
  renderCategoryFilter();
  renderProducts();
}

// ============================================================
// ADMIN TABS
// ============================================================
function showAdminTab(name,btn){
  document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.admin-nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  if(btn){btn.classList.add('active');}
  if(name==='dashboard') renderAdminDashboard();
  if(name==='products') renderAdminProducts();
  if(name==='categories') renderAdminCategories();
  if(name==='orders') renderAdminOrders();
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
function renderAdminDashboard(){
  const products=getProducts();
  const cats=getCategories();
  const visible=products.filter(p=>p.visible).length;
  
  const initialStats = [
    {val:products.length,label:'Total Products'},
    {val:visible,label:'Active Listings'},
    {val:cats.length,label:'Categories'},
    {val:0,label:'Pending Enquiries'}
  ];
  document.getElementById('dashStats').innerHTML=initialStats.map(s=>`<div class="stat-card"><div class="stat-val">${s.val}</div><div class="stat-label">${s.label}</div></div>`).join('');

  fetch('/api/orders', {
    headers: { 'X-Admin-Token': 'authenticated' }
  })
  .then(res => res.json())
  .then(orders => {
    if (orders) {
      const pendingOrders = orders.filter(o => o.status === 'Pending').length;
      const stats = [
        {val:products.length,label:'Total Products'},
        {val:visible,label:'Active Listings'},
        {val:cats.length,label:'Categories'},
        {val:pendingOrders,label:'Pending Enquiries'}
      ];
      document.getElementById('dashStats').innerHTML=stats.map(s=>`<div class="stat-card"><div class="stat-val">${s.val}</div><div class="stat-label">${s.label}</div></div>`).join('');
    }
  })
  .catch(err => console.error('Failed to load dashboard stats from server:', err));
  
  const recent=products.slice(-6).reverse();
  document.getElementById('recentProductsTbody').innerHTML=recent.map(p=>`
    <tr>
      <td>${p.image?`<img src="${p.image}" class="td-img" style="width:40px;height:40px;object-fit:cover;border-radius:4px">`:`<div class="td-img">${EMOJI_MAP[p.category]||'✦'}</div>`}</td>
      <td style="font-family:'Cormorant Garamond',serif;font-size:1rem">${p.name}</td>
      <td style="color:var(--text-dim)">${p.category}</td>
      <td style="color:var(--gold)">₹${p.price.toLocaleString('en-IN')}</td>
      <td>${p.stock}</td>
      <td><span class="badge-vis ${p.visible?'badge-visible':'badge-hidden'}">${p.visible?'Visible':'Hidden'}</span></td>
    </tr>`).join('');
}

// ============================================================
// ADMIN PRODUCTS
// ============================================================
function renderAdminProducts(){
  const products=getProducts();
  document.getElementById('productsTbody').innerHTML=products.map(p=>`
    <tr>
      <td>${p.image?`<img src="${p.image}" style="width:48px;height:48px;object-fit:cover;border-radius:4px">`:`<div class="td-img">${EMOJI_MAP[p.category]||'✦'}</div>`}</td>
      <td style="font-family:'Cormorant Garamond',serif;font-size:1rem;color:var(--cream)">${p.name}</td>
      <td style="color:var(--text-dim)">${p.category}</td>
      <td style="color:var(--gold)">₹${p.price.toLocaleString('en-IN')}</td>
      <td>${p.stock}</td>
      <td>${p.featured?'<span style="color:var(--gold)">★ Yes</span>':'<span style="color:var(--text-muted)">—</span>'}</td>
      <td><span class="badge-vis ${p.visible?'badge-visible':'badge-hidden'}">${p.visible?'Visible':'Hidden'}</span></td>
      <td>
        <div class="tbl-actions">
          <button class="btn-tbl edit" onclick="editProduct(${p.id})">✏ Edit</button>
          <button class="btn-tbl toggle" onclick="toggleVisibility(${p.id})">${p.visible?'Hide':'Show'}</button>
          <button class="btn-tbl del" onclick="deleteProduct(${p.id})">✕ Del</button>
        </div>
      </td>
    </tr>`).join('');
}

// ============================================================
// PRODUCT FORM
// ============================================================
function openProductModal(pid){
  const cats=getCategories();
  const catSel=document.getElementById('pCategory');
  catSel.innerHTML=cats.map(c=>`<option value="${c}">${c}</option>`).join('');
  
  // Clear file inputs to prevent carryover
  document.getElementById('pImageFile').value='';
  const statusEl = document.getElementById('pImageUploadStatus');
  if (statusEl) statusEl.style.display = 'none';
  
  if(pid){
    const p=getProducts().find(x=>x.id==pid);
    if(!p) return;
    document.getElementById('modalTitle').textContent='Edit Product';
    document.getElementById('editProductId').value=p.id;
    document.getElementById('pName').value=p.name;
    document.getElementById('pCategory').value=p.category;
    document.getElementById('pPrice').value=p.price;
    document.getElementById('pOrigPrice').value=p.origPrice||'';
    document.getElementById('pStock').value=p.stock;
    document.getElementById('pDesc').value=p.desc||'';
    document.getElementById('pVisible').checked=p.visible;
    document.getElementById('pFeatured').checked=p.featured;
    document.getElementById('pImageData').value=p.image||'';
    
    // Set URL field if image is a web URL, clear otherwise
    if(p.image && !p.image.startsWith('data:')){
      document.getElementById('pImageUrl').value=p.image;
    } else {
      document.getElementById('pImageUrl').value='';
    }
    
    const prev=document.getElementById('imgPreview');
    if(p.image){prev.src=p.image;prev.style.display='block';}else{prev.style.display='none';}
  } else {
    document.getElementById('modalTitle').textContent='Add Product';
    document.getElementById('editProductId').value='';
    document.getElementById('pName').value='';
    document.getElementById('pCategory').value=cats[0]||'';
    document.getElementById('pPrice').value='';
    document.getElementById('pOrigPrice').value='';
    document.getElementById('pStock').value='10';
    document.getElementById('pDesc').value='';
    document.getElementById('pVisible').checked=true;
    document.getElementById('pFeatured').checked=false;
    document.getElementById('pImageData').value='';
    document.getElementById('pImageUrl').value='';
    document.getElementById('imgPreview').style.display='none';
  }
  document.getElementById('productModal').classList.add('active');
}
function editProduct(pid){openProductModal(pid);}
function closeProductModal(){document.getElementById('productModal').classList.remove('active');}

function previewImage(){
  const file=document.getElementById('pImageFile').files[0];
  if(!file) return;
  
  // Clear the image URL field as we are doing a file upload
  document.getElementById('pImageUrl').value='';
  
  const statusEl = document.getElementById('pImageUploadStatus');
  const saveBtn = document.querySelector('#productModal .btn-save');
  
  if (statusEl) {
    statusEl.textContent = '⏳ Uploading image to storage...';
    statusEl.style.color = 'var(--gold)';
    statusEl.style.display = 'block';
  }
  if (saveBtn) saveBtn.disabled = true;

  const reader=new FileReader();
  reader.onload=e=>{
    const data=e.target.result;
    
    fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: file.name,
        fileType: file.type,
        base64: data
      })
    })
    .then(res => res.json())
    .then(res => {
      if (res.status === 'success') {
        document.getElementById('pImageData').value = res.url;
        const prev = document.getElementById('imgPreview');
        prev.src = res.url;
        prev.style.display = 'block';
        if (statusEl) {
          statusEl.textContent = '✅ Uploaded successfully!';
          statusEl.style.color = '#81C784';
        }
        showToast('Image uploaded successfully', 'success');
      } else {
        throw new Error(res.error || 'Upload failed');
      }
    })
    .catch(err => {
      console.error('Image upload failed:', err);
      if (statusEl) {
        statusEl.textContent = '❌ Upload failed: ' + err.message;
        statusEl.style.color = '#E57373';
      }
      showToast('Upload failed: ' + err.message, 'error');
      document.getElementById('pImageData').value = '';
      document.getElementById('imgPreview').style.display = 'none';
      document.getElementById('pImageFile').value = '';
    })
    .finally(() => {
      if (saveBtn) saveBtn.disabled = false;
    });
  };
  reader.readAsDataURL(file);
}

function previewImageUrl(){
  const url=document.getElementById('pImageUrl').value.trim();
  document.getElementById('pImageData').value=url;
  const prev=document.getElementById('imgPreview');
  
  const statusEl = document.getElementById('pImageUploadStatus');
  if (statusEl) statusEl.style.display = 'none';
  
  if(url){
    prev.src=url;
    prev.style.display='block';
    // Clear the file upload input to avoid confusion
    document.getElementById('pImageFile').value='';
  } else {
    prev.style.display='none';
  }
}

function saveProduct(){
  const name=document.getElementById('pName').value.trim();
  const cat=document.getElementById('pCategory').value;
  const price=parseFloat(document.getElementById('pPrice').value);
  if(!name||!cat||!price){showToast('Please fill required fields','error');return;}
  
  const origPrice=parseFloat(document.getElementById('pOrigPrice').value)||null;
  const stock=parseInt(document.getElementById('pStock').value)||0;
  const desc=document.getElementById('pDesc').value.trim();
  const visible=document.getElementById('pVisible').checked;
  const featured=document.getElementById('pFeatured').checked;
  const image=document.getElementById('pImageData').value;
  const editId=document.getElementById('editProductId').value;
  
  const body = {
    id: editId ? parseInt(editId) : undefined,
    name,
    category: cat,
    price,
    origPrice,
    stock,
    desc,
    visible,
    featured,
    image
  };

  fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': 'authenticated'
    },
    body: JSON.stringify(body)
  })
  .then(res => res.json())
  .then(res => {
    if (res.status === 'success') {
      showToast(editId ? 'Product updated' : 'Product added', 'success');
      loadDataFromServer(() => {
        closeProductModal();
        renderAdminProducts();
        renderAdminDashboard();
      });
    } else {
      showToast(res.message || 'Error saving product', 'error');
    }
  })
  .catch(err => {
    console.error('Error saving product:', err);
    showToast('Failed to save product', 'error');
  });
}

function toggleVisibility(pid){
  const p = cachedProducts.find(x => x.id === pid);
  if (!p) return;
  
  const updatedProduct = { ...p, visible: !p.visible };
  fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': 'authenticated'
    },
    body: JSON.stringify(updatedProduct)
  })
  .then(res => res.json())
  .then(res => {
    if (res.status === 'success') {
      showToast(p.visible ? 'Product hidden' : 'Product visible');
      loadDataFromServer(() => {
        renderAdminProducts();
        renderAdminDashboard();
      });
    }
  });
}

function deleteProduct(pid){
  if(!confirm('Delete this product? This cannot be undone.')) return;
  fetch(`/api/products?id=${pid}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Token': 'authenticated'
    }
  })
  .then(res => res.json())
  .then(res => {
    if (res.status === 'success') {
      showToast('Product deleted');
      loadDataFromServer(() => {
        renderAdminProducts();
        renderAdminDashboard();
      });
    }
  });
}

// ============================================================
// CATEGORIES
// ============================================================
function renderAdminCategories(){
  const cats=getCategories();
  document.getElementById('catListAdmin').innerHTML=cats.map((c,i)=>`
    <div class="cat-chip">
      <span>${c}</span>
      <button onclick="deleteCategory(${i})" title="Remove">✕</button>
    </div>`).join('');
}

function addCategory(){
  const inp=document.getElementById('newCatInput');
  const name=inp.value.trim();
  if(!name) return;
  
  fetch('/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': 'authenticated'
    },
    body: JSON.stringify({ name })
  })
  .then(res => res.json())
  .then(res => {
    if (res.status === 'success') {
      showToast('Category added: ' + name, 'success');
      inp.value = '';
      loadDataFromServer(() => {
        renderAdminCategories();
        renderCategoryFilter();
      });
    } else {
      showToast(res.message || 'Error adding category', 'error');
    }
  })
  .catch(err => {
    console.error('Error adding category:', err);
    showToast('Failed to add category', 'error');
  });
}

function deleteCategory(idx){
  const name = cachedCategories[idx];
  if(!confirm('Delete category "'+name+'"? Products in this category won\'t be deleted.')) return;
  
  fetch(`/api/categories?name=${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Token': 'authenticated'
    }
  })
  .then(res => res.json())
  .then(res => {
    if (res.status === 'success') {
      showToast('Category removed');
      loadDataFromServer(() => {
        renderAdminCategories();
        renderCategoryFilter();
      });
    }
  });
}

// ============================================================
// TOAST
// ============================================================
let toastTimer;
function showToast(msg,type=''){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.className='toast '+(type?type:'');
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove('show'),2800);
}

// ============================================================
// ORDER FORM MODAL FLOW & SUBMISSION
// ============================================================
function openOrderModal() {
  const cart = getCart();
  if (!cart.length) {
    showToast('Your cart is empty', 'error');
    return;
  }
  document.getElementById('orderModal').classList.add('active');
}

function closeOrderModal() {
  document.getElementById('orderModal').classList.remove('active');
}

function processOrder() {
  const name = document.getElementById('orderName').value.trim();
  const phone = document.getElementById('orderPhone').value.trim();
  const address = document.getElementById('orderAddress').value.trim();
  
  if (!name || !phone || !address) {
    showToast('Please fill all required fields', 'error');
    return;
  }
  
  const cart = getCart();
  const products = getProducts();
  
  // Submit to Google Sheets (backend)
  submitOrder(name, phone, address, cart, products);
  
  // Build WhatsApp Message
  let msg = `🙏 *Alankar by Gayatri — New Enquiry*\n\n`;
  msg += `*Customer Details:*\n`;
  msg += `• *Name:* ${name}\n`;
  msg += `• *Phone:* ${phone}\n`;
  msg += `• *Address:* ${address}\n\n`;
  msg += `*Items:* \n`;
  
  let total = 0;
  cart.forEach(c => {
    const p = products.find(x => x.id === c.id);
    if (p) {
      msg += `• ${p.name} — ₹${p.price.toLocaleString('en-IN')} (Qty: ${c.qty || 1})\n`;
      total += p.price * (c.qty || 1);
    }
  });
  
  msg += `\n*Approx Total: ₹${total.toLocaleString('en-IN')}*\n\nKindly share availability & payment details. Thank you!`;
  
  // Clear cart and close modal
  saveCart([]);
  updateCartCount();
  closeCart();
  closeOrderModal();
  
  const wa = getWhatsAppNumber().replace(/\D/g, '');
  const waUrl = wa ? `https://wa.me/${wa}?text=` : 'https://wa.me/?text=';
  window.open(waUrl + encodeURIComponent(msg), '_blank');
}

function submitOrder(name, phone, address, cart, products) {
  const orderDetails = cart.map(c => {
    const p = products.find(x => x.id === c.id);
    return p ? `${p.name} (Qty: ${c.qty || 1})` : '';
  }).filter(Boolean).join(', ');
  
  const total = cart.reduce((sum, c) => {
    const p = products.find(x => x.id === c.id);
    return sum + (p ? p.price * (c.qty || 1) : 0);
  }, 0);
  
  const data = {
    date: new Date().toISOString(),
    name: name,
    phone: phone,
    address: address,
    items: orderDetails,
    total: total
  };
  
  fetch('/api/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(res => {
    if (res.status === 'success') {
      console.log('Order submitted to backend successfully');
    } else {
      console.warn('Backend order submission returned error:', res.message);
    }
  })
  .catch(error => {
    console.error('Error submitting order to backend:', error);
  });
}

// ============================================================
// THEME MANAGEMENT (DARK / LIGHT MODE)
// ============================================================
function initTheme() {
  const savedTheme = localStorage.getItem('alg_theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
  updateThemeButtons();
}

function toggleTheme() {
  if (document.body.classList.contains('light-theme')) {
    document.body.classList.remove('light-theme');
    localStorage.setItem('alg_theme', 'dark');
    showToast('Switched to Dark Mode', 'success');
  } else {
    document.body.classList.add('light-theme');
    localStorage.setItem('alg_theme', 'light');
    showToast('Switched to Light Mode', 'success');
  }
  updateThemeButtons();
}

function updateThemeButtons() {
  const isLight = document.body.classList.contains('light-theme');
  const label = isLight ? '🌙 Dark Mode' : '☀️ Light Mode';
  
  ['themeToggleBtn', 'adminThemeToggleBtn', 'adminMobileThemeToggleBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = label;
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderAdminOrders() {
  const tbody = document.getElementById('ordersTbody');
  if (!tbody) return;
  
  fetch('/api/orders', {
    headers: {
      'X-Admin-Token': 'authenticated'
    }
  })
  .then(res => res.json())
  .then(orders => {
    if (!orders || !orders.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-dim)">No orders or enquiries found.</td></tr>';
      return;
    }
    
    // Sort orders by date descending (newest first)
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = '';
    orders.forEach(ord => {
      const formattedDate = new Date(ord.date).toLocaleString('en-IN');
      const statusOptions = ['Pending', 'Processing', 'Completed', 'Cancelled'].map(s => 
        `<option value="${s}" ${ord.status === s ? 'selected' : ''}>${s}</option>`
      ).join('');
      
      html += `<tr>
        <td style="font-family:monospace;font-size:0.85rem;color:var(--gold);">${escapeHTML(ord.id)}</td>
        <td style="font-size:0.85rem;color:var(--text-dim);">${escapeHTML(formattedDate)}</td>
        <td style="font-weight:600;color:var(--cream);">${escapeHTML(ord.name)}</td>
        <td><a href="tel:${escapeHTML(ord.phone)}" style="color:var(--gold);text-decoration:none;">${escapeHTML(ord.phone)}</a></td>
        <td style="max-width:180px;white-space:normal;word-break:break-word;font-size:0.85rem;color:var(--text-dim);">${escapeHTML(ord.address)}</td>
        <td style="max-width:200px;white-space:normal;word-break:break-word;font-size:0.85rem;">${escapeHTML(ord.items)}</td>
        <td style="color:var(--gold);font-weight:600;">₹${(ord.total || 0).toLocaleString('en-IN')}</td>
        <td>
          <select class="form-select status-select" onchange="changeOrderStatus('${ord.id}', this.value)" style="padding:4px 8px;font-size:0.8rem;width:auto;">
            ${statusOptions}
          </select>
        </td>
      </tr>`;
    });
    tbody.innerHTML = html;
  })
  .catch(err => {
    console.error('Error fetching orders:', err);
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#E57373">Error loading orders. Check server console.</td></tr>';
  });
}

function changeOrderStatus(orderId, newStatus) {
  fetch('/api/orders', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': 'authenticated'
    },
    body: JSON.stringify({ id: orderId, status: newStatus })
  })
  .then(res => res.json())
  .then(res => {
    if (res.status === 'success') {
      showToast(`Order status updated to: ${newStatus}`, 'success');
      renderAdminOrders();
      renderAdminDashboard(); // Refresh counts
    } else {
      showToast(res.message || 'Failed to update order status', 'error');
    }
  })
  .catch(err => {
    console.error('Error updating order status:', err);
    showToast('Failed to update status', 'error');
  });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded',()=>{
  initTheme();
  initLogos();
  
  loadDataFromServer(() => {
    checkSharedCart();
    renderCategoryFilter();
    renderProducts();
    updateCartCount();
    
    if(sessionStorage.getItem('alg_admin')==='1') switchToAdmin();
  });
  
  // Fetch configurations from backend
  fetch('/api/settings')
    .then(res => res.json())
    .then(data => {
      appSettings = data;
      updateSocialLinks();
    })
    .catch(err => {
      console.error('Failed to load settings from server:', err);
      updateSocialLinks();
    });
});