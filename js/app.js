/* ========================================
   Cooking for Iris — App Logic
   Firebase real-time sync
   ======================================== */

let dishes = [];
let cart = [];
let orders = [];
let currentFilter = 'All';
let currentDishId = null;
let editingDishId = null;
let pendingPhotoData = null;
let pendingIngredientsPhoto = null;
let pendingRecipePhoto = null;
let recognizingCount = 0;
let formSession = 0;
let savingDish = false;
let placingOrder = false;
const recipePhotoVersion = { ingredients: 0, recipe: 0 };
let ocrLoader = null;

let db = null;
let auth = null;
let ordersListening = false;
let dataReady = false;
let currentPage = 'landing-page';

/* ========================================
   Data Layer — shared Firebase database
   ======================================== */

function init() {
  dishes = JSON.parse(JSON.stringify(DEFAULT_DISHES));
  const fbConfigured = typeof FIREBASE_CONFIG !== 'undefined'
    && FIREBASE_CONFIG.apiKey
    && FIREBASE_CONFIG.apiKey.length > 0;

  if (fbConfigured && typeof firebase !== 'undefined') {
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.database();
      auth = firebase.auth();
      auth.onAuthStateChanged(user => {
        if (user && !ordersListening) {
          ordersListening = true;
          db.ref('orders').on('value', snap => {
            const data = snap.val();
            orders = data ? Object.values(data) : [];
            orders.sort((a, b) => Number(a.id) - Number(b.id));
            refreshView();
          }, error => {
            ordersListening = false;
            console.error('Orders are not available to this account', error);
            showToast('This Google account cannot access kitchen orders.');
          });
        } else if (!user && ordersListening) {
          db.ref('orders').off();
          ordersListening = false;
          orders = [];
          refreshView();
        }
      });
      db.ref('dishes').on('value', snap => {
        const data = snap.val();
        dishes = Object.values(data || {}).filter(dish => dish && !dish.deleted)
          .sort((a, b) => Number(a.id) - Number(b.id));
        setSyncStatus('Saved for everyone', true);
        refreshView();
      }, handleDataError);

    } catch (e) {
      handleDataError(e);
    }
  } else {
    handleDataError(new Error('Firebase is not configured or failed to load'));
  }
  refreshView();
}

function setSyncStatus(message, ready) {
  dataReady = ready;
  const status = document.getElementById('sync-status');
  status.textContent = message;
  status.classList.toggle('online', ready);
  document.querySelectorAll('.requires-sync').forEach(button => { button.disabled = !ready; });
  updateSaveButton();
  document.querySelector('.place-order-btn').disabled = !ready || placingOrder;
}

function handleDataError(error) {
  console.error('Shared database error', error);
  setSyncStatus('Shared database unavailable — changes cannot be saved', false);
  showToast('Shared database unavailable. Please check Firebase permissions.');
}

function requireSync() {
  if (dataReady && db) return true;
  showToast('Cannot save until the shared database is connected.');
  return false;
}

function refreshView() {
  if (currentPage === 'iris-page') {
    renderCategoryFilters();
    renderMenu();
    renderCart();
  } else if (currentPage === 'chef-page') {
    renderOrders();
    renderAllDishes();
    updateOrderBadge();
  }
}

function getNextDishId() {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

function getNextOrderId() {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

/* ========================================
   Photo Handling
   ======================================== */

function compressImage(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;

        if (w > maxSize || h > maxSize) {
          if (w > h) {
            h = Math.round((h * maxSize) / w);
            w = maxSize;
          } else {
            w = Math.round((w * maxSize) / h);
            h = maxSize;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadOcr() {
  if (typeof Tesseract !== 'undefined') return Promise.resolve();
  if (!ocrLoader) {
    ocrLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('OCR library unavailable'));
      document.head.appendChild(script);
    }).catch(error => {
      ocrLoader = null;
      throw error;
    });
  }
  return ocrLoader;
}

function h(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function photoFor(dish) {
  if (dish.photo) return dish.photo;
  const original = DEFAULT_DISHES.find(item => item.id === dish.id && item.name === dish.name);
  return original ? original.photo : '';
}

function safePhoto(url) {
  return typeof url === 'string' && (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(url) || /^images\/[\w-]+\.webp$/.test(url))
    ? h(url) : '';
}

async function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const dataUrl = await compressImage(file, 900, 0.76);
    pendingPhotoData = dataUrl;
    const preview = document.getElementById('photo-preview');
    const placeholder = document.getElementById('photo-placeholder');
    const removeBtn = document.getElementById('photo-remove-btn');
    const area = document.getElementById('photo-upload-area');

    preview.src = dataUrl;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
    removeBtn.style.display = 'flex';
    area.classList.add('has-photo');
  } catch (error) {
    showToast('Could not read that image.');
  }
}

async function handleRecipePhoto(event, section) {
  const file = event.target.files[0];
  if (!file) return;
  const session = formSession;
  let started = false;
  const prefix = section === 'ingredients' ? 'ingredients' : 'recipe';
  const version = ++recipePhotoVersion[prefix];
  const status = document.getElementById(`${prefix}-ocr-status`);
  try {
    status.textContent = 'Preparing image…';
    const dataUrl = await compressImage(file, 1200, 0.78);
    if (session !== formSession || version !== recipePhotoVersion[prefix]) return;
    if (section === 'ingredients') pendingIngredientsPhoto = dataUrl;
    else pendingRecipePhoto = dataUrl;
    const preview = document.getElementById(`${prefix}-photo-preview`);
    preview.src = dataUrl;
    preview.hidden = false;
    document.getElementById(`${prefix}-photo-remove`).hidden = false;
    status.textContent = 'Reading text from photo…';
    recognizingCount++;
    started = true;
    updateSaveButton();
    await loadOcr();
    const worker = await Tesseract.createWorker(['eng', 'chi_sim', 'chi_tra']);
    try {
      const result = await worker.recognize(file);
      if (session !== formSession || version !== recipePhotoVersion[prefix]) return;
      const lines = result.data.text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      const field = document.getElementById(`dish-${prefix}`);
      if (lines.length) {
        field.value = [field.value.trim(), ...lines].filter(Boolean).join('\n');
        status.textContent = `${lines.length} lines extracted. Please review and edit the text before saving.`;
      } else {
        status.textContent = 'No text found. The photo is kept; you can type the text manually.';
      }
    } finally {
      await worker.terminate();
    }
  } catch (error) {
    if (session !== formSession || version !== recipePhotoVersion[prefix]) return;
    console.warn('Photo OCR failed', error);
    status.textContent = 'Text extraction failed. The photo is kept; please type the text manually.';
  } finally {
    if (started && session === formSession) recognizingCount = Math.max(0, recognizingCount - 1);
    updateSaveButton();
  }
}

function removeRecipePhoto(section) {
  const prefix = section === 'ingredients' ? 'ingredients' : 'recipe';
  recipePhotoVersion[prefix]++;
  if (section === 'ingredients') pendingIngredientsPhoto = '';
  else pendingRecipePhoto = '';
  const preview = document.getElementById(`${prefix}-photo-preview`);
  preview.src = '';
  preview.hidden = true;
  document.getElementById(`${prefix}-photo-remove`).hidden = true;
  document.getElementById(`${prefix}-photo`).value = '';
  document.getElementById(`${prefix}-ocr-status`).textContent = '';
}

function resetRecipePhotos() {
  pendingIngredientsPhoto = null;
  pendingRecipePhoto = null;
  for (const section of ['ingredients', 'recipe']) {
    recipePhotoVersion[section]++;
    const preview = document.getElementById(`${section}-photo-preview`);
    preview.src = '';
    preview.hidden = true;
    document.getElementById(`${section}-photo-remove`).hidden = true;
    document.getElementById(`${section}-photo`).value = '';
    document.getElementById(`${section}-ocr-status`).textContent = '';
  }
}

function updateSaveButton() {
  const button = document.querySelector('#dish-form button[type="submit"]');
  button.disabled = recognizingCount > 0 || savingDish || !dataReady;
  button.textContent = savingDish ? 'Saving for everyone…' : recognizingCount > 0 ? 'Reading photo text…' : 'Save Dish ✨';
}

function removePhoto() {
  pendingPhotoData = '';
  const preview = document.getElementById('photo-preview');
  const placeholder = document.getElementById('photo-placeholder');
  const removeBtn = document.getElementById('photo-remove-btn');
  const area = document.getElementById('photo-upload-area');
  const fileInput = document.getElementById('dish-photo');

  preview.src = '';
  preview.style.display = 'none';
  placeholder.style.display = 'block';
  removeBtn.style.display = 'none';
  area.classList.remove('has-photo');
  fileInput.value = '';
}

function resetPhotoUI() {
  pendingPhotoData = null;
  const preview = document.getElementById('photo-preview');
  const placeholder = document.getElementById('photo-placeholder');
  const removeBtn = document.getElementById('photo-remove-btn');
  const area = document.getElementById('photo-upload-area');
  const fileInput = document.getElementById('dish-photo');

  preview.src = '';
  preview.style.display = 'none';
  placeholder.style.display = 'block';
  removeBtn.style.display = 'none';
  area.classList.remove('has-photo');
  fileInput.value = '';
}

function dishTopHtml(dish) {
  const photo = safePhoto(photoFor(dish));
  if (photo) {
    return `<div class="dish-card-top has-photo">
      <span class="dish-category-tag">${h(dish.category)}</span>
      <img class="dish-card-photo" src="${photo}" alt="${h(dish.name)}" loading="lazy">
    </div>`;
  }
  return `<div class="dish-card-top">
    <span class="dish-category-tag">${h(dish.category)}</span>
    <span class="dish-emoji">${h(dish.emoji)}</span>
  </div>`;
}

function dishHeroHtml(dish) {
  const photo = safePhoto(photoFor(dish));
  if (photo) {
    return `<img class="modal-hero-img" src="${photo}" alt="${h(dish.name)}">`;
  }
  return `<span class="modal-hero-emoji">${h(dish.emoji)}</span>`;
}

function cartItemVisual(dish) {
  const photo = safePhoto(photoFor(dish));
  if (photo) {
    return `<img class="cart-item-photo" src="${photo}" alt="${h(dish.name)}">`;
  }
  return `<span class="cart-item-emoji">${h(dish.emoji)}</span>`;
}

/* ========================================
   Navigation
   ======================================== */

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  currentPage = pageId;
}

async function enterAs(role) {
  if (role === 'iris') {
    showPage('iris-page');
    renderCategoryFilters();
    renderMenu();
    renderCart();
  } else {
    if (!auth) {
      showToast('Firebase sign-in is unavailable.');
      return;
    }
    if (!auth.currentUser) {
      try {
        await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      } catch (error) {
        console.error('Chef sign-in failed', error);
        showToast('Could not sign in. Check Google sign-in in Firebase.');
        return;
      }
    }
    showPage('chef-page');
    renderOrders();
    renderAllDishes();
    updateOrderBadge();
  }
}

function goHome() {
  showPage('landing-page');
  cart = [];
  currentFilter = 'All';
}

/* ========================================
   Iris — Menu
   ======================================== */

function getCategories() {
  const cats = new Set(dishes.map(d => d.category));
  return ['All', ...Array.from(cats).sort()];
}

function renderCategoryFilters() {
  const container = document.getElementById('category-filters');
  const categories = getCategories();
  container.innerHTML = categories.map((cat, index) => `
    <button class="cat-filter ${cat === currentFilter ? 'active' : ''}"
            onclick="filterCategory(getCategories()[${index}])">
      ${h(cat)}
    </button>
  `).join('');
}

function filterCategory(cat) {
  currentFilter = cat;
  renderCategoryFilters();
  renderMenu();
}

function renderMenu() {
  const grid = document.getElementById('menu-grid');
  const filtered = currentFilter === 'All'
    ? dishes
    : dishes.filter(d => d.category === currentFilter);

  if (!filtered.length) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--text-secondary);">
        <span style="font-size:3rem; display:block; margin-bottom:1rem;">🍽️</span>
        No dishes in this category yet.
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map((dish, i) => `
    <div class="dish-card" style="animation-delay: ${i * 0.05}s" onclick="openDishDetail(${Number(dish.id)})">
      ${dishTopHtml(dish)}
      <div class="dish-card-body">
        <h3>${h(dish.name)}</h3>
        <p>${h(dish.description)}</p>
        <div class="dish-meta">
          <span class="dish-time">⏱ ${h(dish.cookTime)}</span>
          <button class="dish-add-btn" onclick="event.stopPropagation(); addToCart(${Number(dish.id)})" title="Add to order">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

/* ========================================
   Iris — Dish Detail Modal
   ======================================== */

function openDishDetail(id) {
  const dish = dishes.find(d => d.id === id);
  if (!dish) return;

  currentDishId = id;
  document.getElementById('modal-hero').innerHTML = dishHeroHtml(dish);
  document.getElementById('modal-title').textContent = dish.name;
  document.getElementById('modal-description').textContent = dish.description;
  document.getElementById('modal-time').textContent = '⏱ ' + dish.cookTime;
  document.getElementById('modal-category').textContent = dish.category;
  document.getElementById('dish-recipe-sections').innerHTML = recipeSectionsHtml(dish);

  const btn = document.getElementById('modal-add-btn');
  btn.onclick = () => {
    addToCart(id);
    closeDishModal();
  };

  document.getElementById('dish-modal').classList.add('open');
}

async function signOutChef() {
  if (auth) await auth.signOut();
  goHome();
}

function recipeSectionsHtml(dish) {
  return sectionHtml('Ingredients', dish.ingredients || [], dish.ingredientsPhoto, false)
    + sectionHtml('Recipe steps', dish.recipe || [], dish.recipePhoto, true);
}

function sectionHtml(title, lines, photo, numbered) {
  const image = safePhoto(photo);
  const textHtml = numbered
    ? `<ol class="recipe-steps">${lines.map(line => `<li>${h(line)}</li>`).join('')}</ol>`
    : `<ul class="ingredient-list">${lines.map(line => `<li>${h(line)}</li>`).join('')}</ul>`;
  return `<section class="recipe-section photo-text-section">
    <div class="recipe-section-heading"><h4>${h(title)}</h4>
      ${image ? `<div class="view-switch" role="group" aria-label="${h(title)} view">
        <button type="button" class="active" onclick="showRecipeView(this, 'text')">Text</button>
        <button type="button" onclick="showRecipeView(this, 'photo')">Photo</button>
      </div>` : ''}
    </div>
    <div class="recipe-text-view">${textHtml}</div>
    ${image ? `<div class="recipe-photo-view" hidden><img src="${image}" alt="${h(title)} photo" loading="lazy"></div>` : ''}
  </section>`;
}

function showRecipeView(button, view) {
  const section = button.closest('.photo-text-section');
  section.querySelector('.recipe-text-view').hidden = view !== 'text';
  section.querySelector('.recipe-photo-view').hidden = view !== 'photo';
  section.querySelectorAll('.view-switch button').forEach(item => {
    item.classList.toggle('active', item === button);
  });
}

function closeDishModal() {
  document.getElementById('dish-modal').classList.remove('open');
}

function closeModal(e) {
  if (e.target.classList.contains('modal-overlay')) {
    if (e.target.id === 'add-dish-modal') closeAddDish();
    else e.target.classList.remove('open');
  }
}

/* ========================================
   Iris — Cart
   ======================================== */

function addToCart(id) {
  const existing = cart.find(c => c.dishId === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ dishId: id, qty: 1 });
  }
  renderCart();
  showToast('Added to your order! 💕');
}

function updateCartQty(dishId, delta) {
  const item = cart.find(c => c.dishId === dishId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(c => c.dishId !== dishId);
  }
  renderCart();
}

function renderCart() {
  const countEl = document.getElementById('cart-count');
  const itemsEl = document.getElementById('cart-items');
  const footerEl = document.getElementById('cart-footer');

  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
  countEl.textContent = totalItems;

  if (!cart.length) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <span class="empty-emoji">🛒</span>
        <p>Your order is empty.<br>Browse the menu and add some dishes!</p>
      </div>`;
    footerEl.style.display = 'none';
    return;
  }

  footerEl.style.display = 'block';

  itemsEl.innerHTML = cart.map(item => {
    const dish = dishes.find(d => d.id === item.dishId);
    if (!dish) return '';
    return `
      <div class="cart-item">
        ${cartItemVisual(dish)}
        <div class="cart-item-info">
          <h4>${h(dish.name)}</h4>
          <p>${h(dish.category)}</p>
        </div>
        <div class="cart-qty">
          <button class="qty-btn" onclick="updateCartQty(${Number(item.dishId)}, -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="updateCartQty(${Number(item.dishId)}, 1)">+</button>
        </div>
      </div>`;
  }).join('');
}

function toggleCart() {
  document.getElementById('cart-sidebar').classList.toggle('open');
  document.getElementById('cart-overlay').classList.toggle('open');
}

/* ========================================
   Iris — Place Order
   ======================================== */

async function placeOrder() {
  if (!cart.length || placingOrder) return;
  if (!requireSync()) return;
  placingOrder = true;
  document.querySelector('.place-order-btn').disabled = true;

  const notes = document.getElementById('order-notes').value.trim();
  const order = {
    id: getNextOrderId(),
    items: cart.map(c => ({ dishId: c.dishId, qty: c.qty })),
    notes: notes,
    status: 'pending',
    timestamp: new Date().toISOString()
  };

  try {
    await db.ref(`orders/${order.id}`).set(order);
  } catch (error) {
    handleDataError(error);
    placingOrder = false;
    return;
  }

  placingOrder = false;

  cart = [];
  document.getElementById('order-notes').value = '';
  renderCart();
  toggleCart();

  document.getElementById('order-success').classList.add('open');
  document.querySelector('.place-order-btn').disabled = !dataReady;
}

function closeOrderSuccess() {
  document.getElementById('order-success').classList.remove('open');
}

/* ========================================
   Chef — Orders
   ======================================== */

function renderOrders() {
  const list = document.getElementById('orders-list');
  const pendingOrders = orders.filter(o => o.status !== 'done');
  const doneOrders = orders.filter(o => o.status === 'done');
  const sorted = [...pendingOrders.reverse(), ...doneOrders.reverse()];

  if (!sorted.length) {
    list.innerHTML = `
      <div class="no-orders">
        <span class="empty-emoji">😴</span>
        <p>No orders yet. Iris hasn't placed an order!</p>
      </div>`;
    return;
  }

  list.innerHTML = sorted.map(order => {
    const date = new Date(order.timestamp);
    const timeStr = date.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });

    const statusClass = order.status === 'done' ? 'status-done' :
                        order.status === 'cooking' ? 'status-cooking' : 'status-pending';
    const statusLabel = order.status === 'done' ? '✅ Done' :
                        order.status === 'cooking' ? '🍳 Cooking' : '⏳ Pending';

    const itemChips = order.items.map(item => {
      const dish = dishes.find(d => d.id === item.dishId);
      return dish ? `<span class="order-item-chip">${h(dish.emoji)} ${h(dish.name)} × ${Number(item.qty) || 1}</span>` : '';
    }).join('');

    const notesHtml = order.notes
      ? `<div class="order-notes-preview">💌 "${h(order.notes)}"</div>`
      : '';

    const actionsHtml = order.status === 'done'
      ? `<button class="order-action-btn view-recipe-btn" onclick="viewOrderRecipe(${Number(order.id)})">📖 View Recipe</button>
         <button class="order-action-btn delete-order-btn" onclick="deleteOrder(${Number(order.id)})">🗑 Remove</button>`
      : `<button class="order-action-btn view-recipe-btn" onclick="viewOrderRecipe(${Number(order.id)})">📖 Recipe & Ingredients</button>
         <button class="order-action-btn mark-done-btn" onclick="markOrderStatus(${Number(order.id)})">${order.status === 'pending' ? '🍳 Start Cooking' : '✅ Mark Done'}</button>
         <button class="order-action-btn delete-order-btn" onclick="deleteOrder(${Number(order.id)})">🗑</button>`;

    return `
      <div class="order-card ${order.status === 'done' ? 'completed' : ''}">
        <div class="order-card-header">
          <div>
            <h3>Order #${h(order.id)}</h3>
            <span class="order-time">${timeStr}</span>
          </div>
          <span class="order-status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="order-items-preview">${itemChips}</div>
        ${notesHtml}
        <div class="order-actions">${actionsHtml}</div>
      </div>`;
  }).join('');
}

async function markOrderStatus(id) {
  const order = orders.find(o => o.id === id);
  if (!order) return;
  if (!requireSync()) return;
  const nextStatus = order.status === 'pending' ? 'cooking' : 'done';
  try {
    await db.ref(`orders/${id}/status`).set(nextStatus);
    showToast(nextStatus === 'cooking' ? 'Started cooking! 🍳' : 'Order complete! ✅');
  } catch (error) {
    handleDataError(error);
  }
}

async function deleteOrder(id) {
  if (!requireSync()) return;
  try {
    await db.ref(`orders/${id}`).remove();
    showToast('Order removed');
  } catch (error) {
    handleDataError(error);
  }
}

function updateOrderBadge() {
  const pending = orders.filter(o => o.status !== 'done').length;
  document.getElementById('order-badge').textContent = pending;
}

/* ========================================
   Chef — View Recipe
   ======================================== */

function viewOrderRecipe(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const content = document.getElementById('order-detail-content');

  const dishesHtml = order.items.map(item => {
    const dish = dishes.find(d => d.id === item.dishId);
    if (!dish) return '';

    const photo = safePhoto(photoFor(dish));
    const photoHtml = photo
      ? `<img class="recipe-dish-photo" src="${photo}" alt="${h(dish.name)}">`
      : '';

    return `
      <div class="recipe-dish">
        ${photoHtml}
        <div class="recipe-header">
          <span class="r-emoji">${h(dish.emoji)}</span>
          <div>
            <h3>${h(dish.name)}</h3>
            <span class="r-qty">Quantity: ${item.qty} · ⏱ ${dish.cookTime}</span>
          </div>
        </div>
        ${recipeSectionsHtml(dish)}
      </div>`;
  }).join('');

  const notesHtml = order.notes
    ? `<div class="order-detail-notes">
        <h4>💌 Iris's Note</h4>
        <p>${h(order.notes)}</p>
       </div>`
    : '';

  content.innerHTML = `
    <h2 style="font-family:'Playfair Display',serif; text-align:center; margin-bottom:1.5rem; color:var(--dark-brown);">
      Order #${h(order.id)} — Recipe Card 📖
    </h2>
    ${dishesHtml}
    ${notesHtml}
  `;

  document.getElementById('order-detail-modal').classList.add('open');
}

function closeOrderDetail() {
  document.getElementById('order-detail-modal').classList.remove('open');
}

/* ========================================
   Chef — Manage Dishes
   ======================================== */

function renderAllDishes() {
  const list = document.getElementById('all-dishes-list');
  const local = getLocalDishesToImport();
  const banner = document.getElementById('local-import');
  banner.hidden = !local.length || !dataReady;
  banner.querySelector('span').textContent = `${local.length} dish${local.length === 1 ? '' : 'es'} saved only in this browser.`;

  list.innerHTML = dishes.map(dish => {
    const photo = safePhoto(photoFor(dish));
    const visual = photo
      ? `<img class="manage-dish-photo" src="${photo}" alt="${h(dish.name)}">`
      : `<div class="manage-dish-emoji">${h(dish.emoji)}</div>`;

    return `
      <div class="manage-dish-card">
        ${visual}
        <h3>${h(dish.name)}</h3>
        <p class="dish-cat">${h(dish.category)} · ⏱ ${h(dish.cookTime)}</p>
        <div class="manage-dish-actions">
          <button class="edit-dish-btn" onclick="editDish(${Number(dish.id)})">✏️ Edit</button>
          <button class="delete-dish-btn" onclick="deleteDish(${Number(dish.id)})">🗑 Delete</button>
        </div>
      </div>`;
  }).join('');
}

function getLocalDishesToImport() {
  try {
    const stored = JSON.parse(localStorage.getItem('cfi_dishes') || '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter(item => {
      if (!item || !item.name || dishes.some(dish => dish.name === item.name)) return false;
      const original = DEFAULT_DISHES.find(dish => dish.name === item.name);
      return !original || JSON.stringify([item.description, item.ingredients, item.recipe])
        !== JSON.stringify([original.description, original.ingredients, original.recipe]);
    });
  } catch (error) {
    return [];
  }
}

async function importLocalDishes() {
  if (!requireSync() || !auth?.currentUser) return;
  const items = getLocalDishesToImport();
  if (!items.length) return;
  const button = document.querySelector('#local-import button');
  button.disabled = true;
  button.textContent = 'Importing…';
  try {
    for (const item of items) {
      const id = getNextDishId();
      await db.ref(`dishes/${id}`).set({ ...item, id });
    }
    showToast(`${items.length} dish${items.length === 1 ? '' : 'es'} imported for everyone!`);
    renderAllDishes();
  } catch (error) {
    handleDataError(error);
  } finally {
    button.disabled = false;
    button.textContent = 'Import to shared menu';
  }
}

function switchChefTab(tab) {
  document.querySelectorAll('.chef-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.chef-tab[data-tab="${tab}"]`).classList.add('active');

  document.querySelectorAll('.chef-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(tab === 'orders' ? 'orders-panel' : 'all-dishes-panel').classList.add('active');

  if (tab === 'all-dishes') renderAllDishes();
  if (tab === 'orders') { renderOrders(); updateOrderBadge(); }
}

/* ========================================
   Chef — Add / Edit Dish
   ======================================== */

function openAddDish() {
  if (!requireSync()) return;
  formSession++;
  editingDishId = null;
  document.getElementById('dish-form').reset();
  resetPhotoUI();
  resetRecipePhotos();
  document.getElementById('dish-form-title').textContent = 'Add New Dish 🍽️';
  updateSaveButton();
  document.getElementById('add-dish-modal').classList.add('open');
}

function editDish(id) {
  if (!requireSync()) return;
  formSession++;
  const dish = dishes.find(d => d.id === id);
  if (!dish) return;

  editingDishId = id;
  document.getElementById('dish-name').value = dish.name;
  document.getElementById('dish-emoji').value = dish.emoji;
  document.getElementById('dish-category').value = dish.category;
  document.getElementById('dish-desc').value = dish.description;
  document.getElementById('dish-time').value = dish.cookTime;
  document.getElementById('dish-ingredients').value = dish.ingredients.join('\n');
  document.getElementById('dish-recipe').value = dish.recipe.join('\n');

  resetPhotoUI();
  resetRecipePhotos();
  for (const section of ['ingredients', 'recipe']) {
    const value = dish[`${section}Photo`];
    if (!value) continue;
    const preview = document.getElementById(`${section}-photo-preview`);
    preview.src = value;
    preview.hidden = false;
    document.getElementById(`${section}-photo-remove`).hidden = false;
  }
  if (dish.photo) {
    pendingPhotoData = dish.photo;
    const preview = document.getElementById('photo-preview');
    const placeholder = document.getElementById('photo-placeholder');
    const removeBtn = document.getElementById('photo-remove-btn');
    const area = document.getElementById('photo-upload-area');

    preview.src = dish.photo;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
    removeBtn.style.display = 'flex';
    area.classList.add('has-photo');
  }

  document.getElementById('dish-form-title').textContent = 'Edit Dish 🍽️';
  updateSaveButton();
  document.getElementById('add-dish-modal').classList.add('open');
}

function closeAddDish() {
  formSession++;
  recognizingCount = 0;
  document.getElementById('add-dish-modal').classList.remove('open');
  editingDishId = null;
  resetPhotoUI();
  resetRecipePhotos();
}

async function saveDish(e) {
  e.preventDefault();
  if (!requireSync() || recognizingCount > 0) return;

  const name = document.getElementById('dish-name').value.trim();
  const emoji = document.getElementById('dish-emoji').value.trim();
  const category = document.getElementById('dish-category').value;
  const description = document.getElementById('dish-desc').value.trim();
  const cookTime = document.getElementById('dish-time').value.trim();
  const ingredients = document.getElementById('dish-ingredients').value
    .split('\n').map(s => s.trim()).filter(Boolean);
  const recipe = document.getElementById('dish-recipe').value
    .split('\n').map(s => s.trim()).filter(Boolean);

  if (!ingredients.length || !recipe.length) {
    showToast('Please add ingredients and steps, or upload clear photos to extract them.');
    return;
  }

  const existing = editingDishId ? dishes.find(d => d.id === editingDishId) : null;
  const dish = {
    ...(existing || {}),
    id: existing ? existing.id : getNextDishId(),
    name, emoji, category, description, cookTime, ingredients, recipe
  };
  if (pendingPhotoData !== null) dish.photo = pendingPhotoData || '';
  if (pendingIngredientsPhoto !== null) dish.ingredientsPhoto = pendingIngredientsPhoto || '';
  if (pendingRecipePhoto !== null) dish.recipePhoto = pendingRecipePhoto || '';

  savingDish = true;
  updateSaveButton();
  try {
    await db.ref(`dishes/${dish.id}`).set(dish);
    showToast(existing ? 'Dish updated for everyone! ✨' : 'New dish saved for everyone! 🍽️');
    closeAddDish();
  } catch (error) {
    handleDataError(error);
  } finally {
    savingDish = false;
    updateSaveButton();
  }
}

async function deleteDish(id) {
  if (!confirm('Are you sure you want to remove this dish?')) return;
  if (!requireSync()) return;
  try {
    await db.ref(`dishes/${id}`).remove();
    showToast('Dish removed for everyone');
  } catch (error) {
    handleDataError(error);
  }
}

/* ========================================
   Toast
   ======================================== */

let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ========================================
   Init
   ======================================== */

init();
