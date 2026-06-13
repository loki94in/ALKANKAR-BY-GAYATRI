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

function getData(key, def){try{const v=localStorage.getItem(key);return v?JSON.parse(v):def;}catch(e){return def;}}
function setData(key,val){localStorage.setItem(key,JSON.stringify(val));}

function getProducts(){return getData('alg_products', DEFAULT_PRODUCTS);}
function saveProducts(p){setData('alg_products',p);}
function getCategories(){return getData('alg_categories', DEFAULT_CATEGORIES);}
function saveCategories(c){setData('alg_categories',c);}
function getCart(){return getData('alg_cart',[]);}
function saveCart(c){setData('alg_cart',c);}
function getNextId(){const p=getProducts();return p.length?Math.max(...p.map(x=>x.id))+1:1;}

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
  const all = ['All',...cats];
  const wrap = document.getElementById('catFilter');
  wrap.innerHTML = all.map(c=>`<button class="cat-btn${c===currentCat?' active':''}" onclick="filterCat('${c}')">${c}</button>`).join('');
}

function filterCat(cat){
  currentCat = cat;
  renderCategoryFilter();
  renderProducts();
}

function renderProducts(){
  const products = getProducts();
  const filtered = products.filter(p=>{
    if(!p.visible) return false;
    if(currentCat==='All') return true;
    return p.category === currentCat;
  });
  const grid = document.getElementById('productGrid');
  document.getElementById('catalogHeading').textContent = currentCat==='All'?'All Jewellery':currentCat;
  document.getElementById('productCount').textContent = filtered.length + ' piece'+(filtered.length!==1?'s':'');

  if(!filtered.length){
    grid.innerHTML = '<div class="no-products" style="grid-column:1/-1">✦ No pieces in this collection yet ✦</div>';
    return;
  }
  grid.innerHTML = filtered.map(p=>productCard(p)).join('');
}

const EMOJI_MAP = {'Necklaces':'📿','Earrings':'💎','Bangles':'⭕','Rings':'💍','Bridal':'👑','Hair Accessories':'✨','Anklets':'🌸'};

function productCard(p){
  const img = p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` 
    : `<div class="product-img-placeholder">${EMOJI_MAP[p.category]||'✦'}</div>`;
  const badge = p.featured ? `<div class="product-badge">New</div>` : '';
  const origPrice = p.origPrice ? `<span class="original">₹${p.origPrice.toLocaleString('en-IN')}</span>` : '';
  return `<div class="product-card">
    <div class="product-img-wrap">${img}${badge}</div>
    <div class="product-body">
      <div class="product-category">${p.category}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-price">₹${p.price.toLocaleString('en-IN')}${origPrice}</div>
    </div>
    <div class="product-actions">
      <button class="btn-cart" onclick="addToCart(${p.id})">Add to Cart</button>
      <button class="btn-wish" onclick="addToCart(${p.id})" title="Add">♡</button>
    </div>
  </div>`;
}

// ============================================================
// CART
// ============================================================
function addToCart(pid){
  const products = getProducts();
  const p = products.find(x=>x.id===pid);
  if(!p) return;
  let cart = getCart();
  const existing = cart.find(x=>x.id===pid);
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
    const p = products.find(x=>x.id===item.id);
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
  const item=cart.find(x=>x.id===pid);
  if(!item) return;
  item.qty=(item.qty||1)+delta;
  if(item.qty<1) cart=cart.filter(x=>x.id!==pid);
  saveCart(cart);
  updateCartCount();
  renderCartPanel();
}
function removeFromCart(pid){
  let cart=getCart().filter(x=>x.id!==pid);
  saveCart(cart);
  updateCartCount();
  renderCartPanel();
}

function shareCatalogLink(){
  const cart=getCart();
  const products=getProducts();
  const items=cart.map(c=>{const p=products.find(x=>x.id===c.id);return p?`${p.name} (x${c.qty||1})`:null}).filter(Boolean);
  const encoded=btoa(JSON.stringify(cart));
  const url=window.location.href.split('?')[0]+'?cart='+encoded;
  navigator.clipboard.writeText(url).then(()=>showToast('Link copied to clipboard!','success')).catch(()=>{
    prompt('Copy this link:',url);
  });
}

function shareOnWhatsApp(){
  const cart=getCart();
  const products=getProducts();
  let msg='✨ *Alankar by Gayatri* — My Wishlist\n\n';
  let total=0;
  cart.forEach(c=>{
    const p=products.find(x=>x.id===c.id);
    if(p){msg+=`• ${p.name} (${p.category}) — ₹${p.price.toLocaleString('en-IN')} x${c.qty||1}\n`;total+=p.price*(c.qty||1);}
  });
  msg+=`\n*Total: ₹${total.toLocaleString('en-IN')}*\n\n📸 instagram.com/${getInstagramHandle()}`;
  window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
}

function enquireOnWhatsApp(){
  const cart=getCart();
  const products=getProducts();
  let msg='🙏 Namaste! I am interested in the following pieces from Alankar by Gayatri:\n\n';
  let total=0;
  cart.forEach(c=>{
    const p=products.find(x=>x.id===c.id);
    if(p){msg+=`• ${p.name} — ₹${p.price.toLocaleString('en-IN')} (Qty: ${c.qty||1})\n`;total+=p.price*(c.qty||1);}
  });
  msg+=`\n*Approx Total: ₹${total.toLocaleString('en-IN')}*\n\nKindly share availability & payment details. Thank you!`;
  const wa = getWhatsAppNumber().replace(/\D/g, '');
  const waUrl = wa ? `https://wa.me/${wa}?text=` : 'https://wa.me/?text=';
  window.open(waUrl+encodeURIComponent(msg),'_blank');
}

// ============================================================
// SHARED CART FROM URL
// ============================================================
function checkSharedCart(){
  const params = new URLSearchParams(window.location.search);
  const cartParam = params.get('cart');
  if(cartParam){
    try{
      const decoded=JSON.parse(atob(cartParam));
      saveCart(decoded);
      updateCartCount();
      document.getElementById('sharedBanner').classList.add('active');
      setTimeout(()=>document.getElementById('sharedBanner').classList.remove('active'),5000);
    }catch(e){}
  }
}

// ============================================================
// ADMIN AUTH
// ============================================================

function triggerAdminHint(){
  sessionStorage.setItem('alg_admin','1');
  switchToAdmin();
  showToast('Logged in as administrator (Testing Mode)', 'success');
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
function showAdminSettings(){
  const html=`<div class="modal-box"><div class="modal-head"><h3>Admin Environment Configuration</h3><button class="modal-close" onclick="closeAdminSettings()">✕</button></div>`+
    `<div class="modal-body" style="line-height: 1.6;">`+
    `<div style="background:var(--crimson-dark);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px;font-size:0.85rem;color:var(--text-dim);">`+
      `<strong style="color:var(--gold);display:block;margin-bottom:6px;">🔒 Server-Side Security Active</strong>`+
      `All administrative credentials and API keys are now securely managed on the backend of the website. To update these values, configure the following environment variables in your hosting environment (e.g. Vercel) or your local <code>.env</code> file:`+
    `</div>`+
    `<ul style="list-style:none;padding-left:0;font-size:0.85rem;color:var(--text);display:flex;flex-direction:column;gap:10px;">`+
      `<li><strong>ADMIN_USER</strong>: Admin username</li>`+
      `<li><strong>ADMIN_PASS</strong>: Admin login password</li>`+
      `<li><strong>GOOGLE_SHEET_URL</strong>: Google Sheets Apps Script URL</li>`+
      `<li><strong>INSTAGRAM_HANDLE</strong>: Instagram handle</li>`+
      `<li><strong>WHATSAPP_NUMBER</strong>: WhatsApp number</li>`+
    `</ul>`+
    `</div>`+
    `<div class="modal-footer"><button class="btn-save" onclick="closeAdminSettings()">Close</button></div></div>`;
  const overlay=document.createElement('div');
  overlay.id='adminSettingsOverlay';
  overlay.style.position='fixed';overlay.style.inset='0';overlay.style.background='rgba(0,0,0,0.7)';overlay.style.zIndex='600';
  overlay.innerHTML=`<div class="admin-settings-modal" style="position:relative;max-width:500px;margin:100px auto;background:var(--bg3);padding:20px;border:1px solid var(--border);border-radius:8px">${html}</div>`;
  document.body.appendChild(overlay);
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
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
function renderAdminDashboard(){
  const products=getProducts();
  const cats=getCategories();
  const cart=getCart();
  const visible=products.filter(p=>p.visible).length;
  const stats=[
    {val:products.length,label:'Total Products'},
    {val:visible,label:'Active Listings'},
    {val:cats.length,label:'Categories'},
    {val:cart.length,label:'Cart Items'},
  ];
  document.getElementById('dashStats').innerHTML=stats.map(s=>`<div class="stat-card"><div class="stat-val">${s.val}</div><div class="stat-label">${s.label}</div></div>`).join('');
  
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
  
  if(pid){
    const p=getProducts().find(x=>x.id===pid);
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
  
  const reader=new FileReader();
  reader.onload=e=>{
    const data=e.target.result;
    document.getElementById('pImageData').value=data;
    const prev=document.getElementById('imgPreview');
    prev.src=data;prev.style.display='block';
  };
  reader.readAsDataURL(file);
}

function previewImageUrl(){
  const url=document.getElementById('pImageUrl').value.trim();
  document.getElementById('pImageData').value=url;
  const prev=document.getElementById('imgPreview');
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
  
  let products=getProducts();
  if(editId){
    const idx=products.findIndex(x=>x.id==editId);
    if(idx>=0) products[idx]={...products[idx],name,category:cat,price,origPrice,stock,desc,visible,featured,image};
    showToast('Product updated','success');
  } else {
    products.push({id:getNextId(),name,category:cat,price,origPrice,stock,desc,visible,featured,image});
    showToast('Product added','success');
  }
  saveProducts(products);
  closeProductModal();
  renderAdminProducts();
  renderAdminDashboard();
}

function toggleVisibility(pid){
  let products=getProducts();
  const p=products.find(x=>x.id===pid);
  if(p){p.visible=!p.visible;saveProducts(products);renderAdminProducts();renderAdminDashboard();showToast(p.visible?'Product visible in catalog':'Product hidden from catalog');}
}

function deleteProduct(pid){
  if(!confirm('Delete this product? This cannot be undone.')) return;
  let products=getProducts().filter(x=>x.id!==pid);
  saveProducts(products);
  renderAdminProducts();
  renderAdminDashboard();
  showToast('Product deleted');
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
  const cats=getCategories();
  if(cats.includes(name)){showToast('Category already exists','error');return;}
  cats.push(name);
  saveCategories(cats);
  inp.value='';
  renderAdminCategories();
  renderCategoryFilter();
  showToast('Category added: '+name,'success');
}

function deleteCategory(idx){
  let cats=getCategories();
  const name=cats[idx];
  if(!confirm('Delete category "'+name+'"? Products in this category won\'t be deleted.')) return;
  cats.splice(idx,1);
  saveCategories(cats);
  renderAdminCategories();
  renderCategoryFilter();
  showToast('Category removed');
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

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded',()=>{
  initTheme();
  initLogos();
  checkSharedCart();
  renderCategoryFilter();
  renderProducts();
  updateCartCount();
  
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
    
  if(sessionStorage.getItem('alg_admin')==='1') switchToAdmin();
});