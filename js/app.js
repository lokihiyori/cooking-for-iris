/* ========================================
   Cooking for Iris — App Logic
   Firebase real-time sync + localStorage fallback
   ======================================== */

let dishes = [];
let cart = [];
let orders = [];
let currentFilter = 'All';
let currentDishId = null;
let editingDishId = null;
let pendingPhotoData = null;

let db = null;
let useFirebase = false;
let currentPage = 'landing-page';

/* ========================================
   Data Layer — Firebase + localStorage
   ======================================== */

function init() {
  const fbConfigured = typeof FIREBASE_CONFIG !== 'undefined'
    && FIREBASE_CONFIG.apiKey
    && FIREBASE_CONFIG.apiKey.length > 0;

  if (fbConfigured && typeof firebase !== 'undefined') {
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.database();
      useFirebase = true;

      db.ref('dishes').on('value', snap => {
        const data = snap.val();
        if (data) {
          dishes = Object.values(data);
          dishes.sort((a, b) => a.id - b.id);
        } else {
          dishes = JSON.parse(JSON.stringify(DEFAULT_DISHES));
          persistDishes();
        }
        refreshView();
      });

      db.ref('orders').on('value', snap => {
        const data = snap.val();
        orders = data ? Object.values(data) : [];
        orders.sort((a, b) => a.id - b.id);
        refreshView();
      });
    } catch (e) {
      console.warn('Firebase init failed, using localStorage', e);
      initLocalStorage();
    }
  } else {
    initLocalStorage();
  }
}

function initLocalStorage() {
  useFirebase = false;
  const stored = localStorage.getItem('cfi_dishes');
  if (stored) {
    dishes = JSON.parse(stored);
  } else {
    dishes = JSON.parse(JSON.stringify(DEFAULT_DISHES));
    localStorage.setItem('cfi_dishes', JSON.stringify(dishes));
  }
  orders = JSON.parse(localStorage.getItem('cfi_orders') || '[]');
}

function persistDishes() {
  if (useFirebase) {
    const obj = {};
    dishes.forEach(d => { obj[d.id] = d; });
    db.ref('dishes').set(obj);
  } else {
    localStorage.setItem('cfi_dishes', JSON.stringify(dishes));
  }
}

function persistOrders() {
  if (useFirebase) {
    const obj = {};
    orders.forEach(o => { obj[o.id] = o; });
    db.ref('orders').set(obj);
  } else {
    localStorage.setItem('cfi_orders', JSON.stringify(orders));
  }
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
  return dishes.length ? Math.max(...dishes.map(d => d.id)) + 1 : 1;
}

function getNextOrderId() {
  return orders.length ? Math.max(...orders.map(o => o.id)) + 1 : 1;
}

/* ========================================
   Photo Handling
   ======================================== */

function compressImage(file, maxSize, quality) {
  return new Promise((resolve) => {
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
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  compressImage(file, 600, 0.7).then(dataUrl => {
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
  });
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
  if (dish.photo) {
    return `<div class="dish-card-top has-photo">
      <span class="dish-category-tag">${dish.category}</span>
      <img class="dish-card-photo" src="${dish.photo}" alt="${dish.name}" loading="lazy">
    </div>`;
  }
  return `<div class="dish-card-top">
    <span class="dish-category-tag">${dish.category}</span>
    <span class="dish-emoji">${dish.emoji}</span>
  </div>`;
}

function dishHeroHtml(dish) {
  if (dish.photo) {
    return `<img class="modal-hero-img" src="${dish.photo}" alt="${dish.name}">`;
  }
  return `<span class="modal-hero-emoji">${dish.emoji}</span>`;
}

function cartItemVisual(dish) {
  if (dish.photo) {
    return `<img class="cart-item-photo" src="${dish.photo}" alt="${dish.name}">`;
  }
  return `<span class="cart-item-emoji">${dish.emoji}</span>`;
}

/* ========================================
   Navigation
   ======================================== */

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  currentPage = pageId;
}

function enterAs(role) {
  if (role === 'iris') {
    showPage('iris-page');
    renderCategoryFilters();
    renderMenu();
    renderCart();
  } else {
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
  container.innerHTML = categories.map(cat => `
    <button class="cat-filter ${cat === currentFilter ? 'active' : ''}"
            onclick="filterCategory('${cat}')">
      ${cat}
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
    <div class="dish-card" style="animation-delay: ${i * 0.05}s" onclick="openDishDetail(${dish.id})">
      ${dishTopHtml(dish)}
      <div class="dish-card-body">
        <h3>${dish.name}</h3>
        <p>${dish.description}</p>
        <div class="dish-meta">
          <span class="dish-time">⏱ ${dish.cookTime}</span>
          <button class="dish-add-btn" onclick="event.stopPropagation(); addToCart(${dish.id})" title="Add to order">+</button>
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

  const btn = document.getElementById('modal-add-btn');
  btn.onclick = () => {
    addToCart(id);
    closeDishModal();
  };

  document.getElementById('dish-modal').classList.add('open');
}

function closeDishModal() {
  document.getElementById('dish-modal').classList.remove('open');
}

function closeModal(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
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
          <h4>${dish.name}</h4>
          <p>${dish.category}</p>
        </div>
        <div class="cart-qty">
          <button class="qty-btn" onclick="updateCartQty(${item.dishId}, -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="updateCartQty(${item.dishId}, 1)">+</button>
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

function placeOrder() {
  if (!cart.length) return;

  const notes = document.getElementById('order-notes').value.trim();
  const order = {
    id: getNextOrderId(),
    items: cart.map(c => ({ dishId: c.dishId, qty: c.qty })),
    notes: notes,
    status: 'pending',
    timestamp: new Date().toISOString()
  };

  orders.push(order);
  persistOrders();

  cart = [];
  document.getElementById('order-notes').value = '';
  renderCart();
  toggleCart();

  document.getElementById('order-success').classList.add('open');
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
      return dish ? `<span class="order-item-chip">${dish.emoji} ${dish.name} × ${item.qty}</span>` : '';
    }).join('');

    const notesHtml = order.notes
      ? `<div class="order-notes-preview">💌 "${order.notes}"</div>`
      : '';

    const actionsHtml = order.status === 'done'
      ? `<button class="order-action-btn view-recipe-btn" onclick="viewOrderRecipe(${order.id})">📖 View Recipe</button>
         <button class="order-action-btn delete-order-btn" onclick="deleteOrder(${order.id})">🗑 Remove</button>`
      : `<button class="order-action-btn view-recipe-btn" onclick="viewOrderRecipe(${order.id})">📖 Recipe & Ingredients</button>
         <button class="order-action-btn mark-done-btn" onclick="markOrderStatus(${order.id})">${order.status === 'pending' ? '🍳 Start Cooking' : '✅ Mark Done'}</button>
         <button class="order-action-btn delete-order-btn" onclick="deleteOrder(${order.id})">🗑</button>`;

    return `
      <div class="order-card ${order.status === 'done' ? 'completed' : ''}">
        <div class="order-card-header">
          <div>
            <h3>Order #${order.id}</h3>
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

function markOrderStatus(id) {
  const order = orders.find(o => o.id === id);
  if (!order) return;

  if (order.status === 'pending') {
    order.status = 'cooking';
    showToast('Started cooking! 🍳');
  } else if (order.status === 'cooking') {
    order.status = 'done';
    showToast('Order complete! ✅');
  }

  persistOrders();
  renderOrders();
  updateOrderBadge();
}

function deleteOrder(id) {
  orders = orders.filter(o => o.id !== id);
  persistOrders();
  renderOrders();
  updateOrderBadge();
  showToast('Order removed');
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

    const photoHtml = dish.photo
      ? `<img class="recipe-dish-photo" src="${dish.photo}" alt="${dish.name}">`
      : '';

    const ingredientsHtml = dish.ingredients.map(ing =>
      `<li>${ing}</li>`
    ).join('');

    const stepsHtml = dish.recipe.map(step =>
      `<li>${step}</li>`
    ).join('');

    return `
      <div class="recipe-dish">
        ${photoHtml}
        <div class="recipe-header">
          <span class="r-emoji">${dish.emoji}</span>
          <div>
            <h3>${dish.name}</h3>
            <span class="r-qty">Quantity: ${item.qty} · ⏱ ${dish.cookTime}</span>
          </div>
        </div>
        <div class="recipe-section">
          <h4>🛒 Ingredients</h4>
          <ul class="ingredient-list">${ingredientsHtml}</ul>
        </div>
        <div class="recipe-section">
          <h4>👨‍🍳 Recipe Steps</h4>
          <ol class="recipe-steps">${stepsHtml}</ol>
        </div>
      </div>`;
  }).join('');

  const notesHtml = order.notes
    ? `<div class="order-detail-notes">
        <h4>💌 Iris's Note</h4>
        <p>${order.notes}</p>
       </div>`
    : '';

  content.innerHTML = `
    <h2 style="font-family:'Playfair Display',serif; text-align:center; margin-bottom:1.5rem; color:var(--dark-brown);">
      Order #${order.id} — Recipe Card 📖
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

  list.innerHTML = dishes.map(dish => {
    const visual = dish.photo
      ? `<img class="manage-dish-photo" src="${dish.photo}" alt="${dish.name}">`
      : `<div class="manage-dish-emoji">${dish.emoji}</div>`;

    return `
      <div class="manage-dish-card">
        ${visual}
        <h3>${dish.name}</h3>
        <p class="dish-cat">${dish.category} · ⏱ ${dish.cookTime}</p>
        <div class="manage-dish-actions">
          <button class="edit-dish-btn" onclick="editDish(${dish.id})">✏️ Edit</button>
          <button class="delete-dish-btn" onclick="deleteDish(${dish.id})">🗑 Delete</button>
        </div>
      </div>`;
  }).join('');
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
  editingDishId = null;
  document.getElementById('dish-form').reset();
  resetPhotoUI();
  document.getElementById('add-dish-modal').classList.add('open');
}

function editDish(id) {
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

  document.getElementById('add-dish-modal').classList.add('open');
}

function closeAddDish() {
  document.getElementById('add-dish-modal').classList.remove('open');
  editingDishId = null;
  resetPhotoUI();
}

function saveDish(e) {
  e.preventDefault();

  const name = document.getElementById('dish-name').value.trim();
  const emoji = document.getElementById('dish-emoji').value.trim();
  const category = document.getElementById('dish-category').value;
  const description = document.getElementById('dish-desc').value.trim();
  const cookTime = document.getElementById('dish-time').value.trim();
  const ingredients = document.getElementById('dish-ingredients').value
    .split('\n').map(s => s.trim()).filter(Boolean);
  const recipe = document.getElementById('dish-recipe').value
    .split('\n').map(s => s.trim()).filter(Boolean);

  if (editingDishId) {
    const dish = dishes.find(d => d.id === editingDishId);
    if (dish) {
      Object.assign(dish, { name, emoji, category, description, cookTime, ingredients, recipe });
      if (pendingPhotoData !== null) {
        dish.photo = pendingPhotoData || '';
      }
    }
    showToast('Dish updated! ✨');
  } else {
    const newDish = {
      id: getNextDishId(),
      name, emoji, category, description, cookTime, ingredients, recipe
    };
    if (pendingPhotoData) {
      newDish.photo = pendingPhotoData;
    }
    dishes.push(newDish);
    showToast('New dish added! 🍽️');
  }

  persistDishes();
  renderAllDishes();
  closeAddDish();
}

function deleteDish(id) {
  if (!confirm('Are you sure you want to remove this dish?')) return;
  dishes = dishes.filter(d => d.id !== id);
  persistDishes();
  renderAllDishes();
  showToast('Dish removed');
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
