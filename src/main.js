/* src/main.js */

import {
  initCheckoutOverlay,
  renderCheckoutCart,
  stopCheckoutTimer,
} from "./checkout.js";

// --- PRODUCT DATA ---
const products = [
  {
    id: "salmon-nigiri",
    name: "Salmon Nigiri",
    price: 149,
    rating: 5.0,
    category: "Nigiri",
    image: "img/salmon-nigiri.jpg",
  },
  {
    id: "avocado-nigiri",
    name: "Avocado Nigiri",
    price: 129,
    rating: 4.3,
    category: "Nigiri",
    image: "img/avocado-nigiri.jpg",
  },
  {
    id: "shrimp-nigiri",
    name: "Shrimp Nigiri",
    price: 139,
    rating: 3.8,
    category: "Nigiri",
    image: "img/shrimp-nigiri.jpg",
  },
  {
    id: "tuna-nigiri",
    name: "Tuna Nigiri",
    price: 159,
    rating: 4.4,
    category: "Nigiri",
    image: "img/tuna-nigiri.jpg",
  },
  {
    id: "california-roll",
    name: "California Maki",
    price: 129,
    rating: 4.0,
    category: "Maki",
    image: "img/california-maki.jpg",
  },
  {
    id: "spicy-tuna-roll",
    name: "Spicy Tuna Roll",
    price: 139,
    rating: 4.8,
    category: "Maki",
    image: "img/spicy-tuna.jpg",
  },
  {
    id: "dragon-roll",
    name: "Dragon Roll",
    price: 169,
    rating: 5.0,
    category: "Maki",
    image: "img/dragon-roll.jpg",
  },
  {
    id: "tempura-roll",
    name: "Tempura Shrimp Roll",
    price: 139,
    rating: 4.6,
    category: "Maki",
    image: "img/tempura-roll.jpg",
  },
  {
    id: "salmon-sashimi",
    name: "Salmon Sashimi",
    price: 195,
    rating: 4.9,
    category: "Sashimi",
    image: "img/salmon-sashimi.jpg",
  },
  {
    id: "mixed-sashimi",
    name: "Large Sashimi Mix",
    price: 279,
    rating: 4.7,
    category: "Sashimi",
    image: "img/sashimi-mix.jpg",
  },
  {
    id: "ramen-pork-broth",
    name: "Ramen Pork Broth",
    price: 169,
    rating: 4.7,
    category: "Ramen",
    image: "img/ramen-pork-broth.jpg",
  },
  {
    id: "dumpling-xiao-long-bao",
    name: "Xiao Long Bao",
    price: 159,
    rating: 4.7,
    category: "Dumplings",
    image: "img/dumpling-xiao-long-bao.jpg",
  },
  {
    id: "dumpling-gyoza",
    name: "Gyoza Dumplings",
    price: 149,
    rating: 4.7,
    category: "Dumplings",
    image: "img/dumpling-gyoza.jpg",
  },
];

// --- SELECTORS ---
const productGrid = document.getElementById("product-grid");
const categoryFilter = document.getElementById("category-filter");
const sortOrder = document.getElementById("sort-order");
const backToTopBtn = document.getElementById("backToTop");

// --- CART SELECTORS ---
const cartIndicator = document.getElementById("cart-indicator");
const cartDrawer = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");
const closeCartBtn = document.getElementById("close-cart");
const clearCartBtn = document.getElementById("clear-cart-btn");
const checkoutBtn = document.getElementById("checkout-btn");

// --- GLOBAL STATE ---
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// --- PRODUCT RENDERING ---

const MAX_QUANTITY = 50; // Safety limit per product

function createProductHTML({ id, name, price, rating, category, image }) {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  // Weekend logic: Friday 15:00 to Monday 03:00
  let isWeekend = false;
  if (
    (day === 5 && hour >= 15) ||
    day === 6 ||
    day === 0 ||
    (day === 1 && hour < 3)
  ) {
    isWeekend = true;
  }
  const displayPrice = isWeekend ? Math.round(price * 1.15) : price;

  return `
    <article class="product-card" tabindex="0" aria-labelledby="product-title-${id}" aria-describedby="product-desc-${id}">
      <img src="${image}" alt="${name} - ${category} sushi" loading="lazy" width="180" height="180">
      <div class="product-info">
        <h3 id="product-title-${id}">${name}</h3>
        <p class="category-tag" id="product-desc-${id}">${category}</p>
        <p class="rating">Rating: ${rating} <span aria-label="out of 5 stars">⭐</span></p>
        <p class="price"><strong>${displayPrice} SEK</strong></p>
        <form class="quantity-input-container" aria-label="Choose quantity for ${name}" onsubmit="return false;">
          <label for="qty-${id}" class="visually-hidden">Quantity</label>
          <button class="qty-btn" type="button" onclick="this.nextElementSibling.stepDown(); this.nextElementSibling.dispatchEvent(new Event('change'))" aria-label="Decrease quantity for ${name}">−</button>
          <input type="number" id="qty-${id}" class="qty-input" value="1" min="1" max="${MAX_QUANTITY}" inputmode="numeric" aria-label="Quantity for ${name}">
          <button class="qty-btn" type="button" onclick="this.previousElementSibling.stepUp(); this.previousElementSibling.dispatchEvent(new Event('change'))" aria-label="Increase quantity for ${name}">+</button>
        </form>
      </div>
      <button class="order-btn" data-id="${id}" aria-label="Add ${name} to cart">Add to Cart</button>
    </article>
  `;
}

function renderProducts(items) {
  if (!productGrid) return;
  productGrid.innerHTML = items.map(createProductHTML).join("");
}

function updateDisplay() {
  const selectedCategory = categoryFilter?.value || "all";
  const selectedSort = sortOrder?.value || "default";

  const filteredItems = products
    .filter(
      (item) =>
        selectedCategory === "all" ||
        item.category.toLowerCase() === selectedCategory.toLowerCase(),
    )
    .sort((a, b) => {
      if (selectedSort === "price-low") return a.price - b.price;
      if (selectedSort === "price-high") return b.price - a.price;
      if (selectedSort === "rating") return b.rating - a.rating;
      if (selectedSort === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  renderProducts(filteredItems);
}

// --- CART LOGIC ---

function toggleCart() {
  cartDrawer?.classList.toggle("active");
  cartOverlay?.classList.toggle("active");
}

function addToCart(productId, buttonElement) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const quantityInput = document.getElementById(`qty-${productId}`);
  let quantityToAdd = parseInt(quantityInput.value) || 1;

  // Validation: Prevent exceeding MAX_QUANTITY from manual input
  if (quantityToAdd > MAX_QUANTITY) {
    alert(`Maximum limit is ${MAX_QUANTITY} per item.`);
    quantityToAdd = MAX_QUANTITY;
    quantityInput.value = MAX_QUANTITY;
  }

  if (quantityToAdd < 1) {
    quantityToAdd = 1;
    quantityInput.value = 1;
  }

  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    const projectedTotal = existingItem.quantity + quantityToAdd;

    if (projectedTotal > MAX_QUANTITY) {
      alert(
        `You can only have a total of ${MAX_QUANTITY} ${product.name} in your cart. You already have ${existingItem.quantity}.`,
      );
      return;
    }
    existingItem.quantity = projectedTotal;
  } else {
    cart.push({ ...product, quantity: quantityToAdd });
  }

  // Reset the input field to 1 after successful add
  quantityInput.value = 1;

  if (buttonElement) {
    createFlyToCartAnimation(buttonElement);
  }

  saveAndUpdateCart();
}

function createFlyToCartAnimation(buttonElement) {
  // Get button position
  const buttonRect = buttonElement.getBoundingClientRect();
  const cartIcon = document.getElementById("cart-indicator");
  const cartRect = cartIcon.getBoundingClientRect();

  // Create animated element
  const flyingItem = document.createElement("div");
  flyingItem.className = "flying-cart-item";
  flyingItem.innerHTML = "🍣";
  flyingItem.style.left = buttonRect.left + buttonRect.width / 2 + "px";
  flyingItem.style.top = buttonRect.top + buttonRect.height / 2 + "px";

  document.body.appendChild(flyingItem);

  // Calculate trajectory
  const deltaX = cartRect.left - buttonRect.left;
  const deltaY = cartRect.top - buttonRect.top;

  // Animate
  setTimeout(() => {
    flyingItem.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.3)`;
    flyingItem.style.opacity = "0";
  }, 10);

  // Remove element after animation
  setTimeout(() => {
    flyingItem.remove();
  }, 800);

  // Button pulse effect
  buttonElement.classList.add("btn-added");
  setTimeout(() => {
    buttonElement.classList.remove("btn-added");
  }, 300);
}

// Globally accessible quantity changer
window.changeQuantity = (index, delta) => {
  if (!cart[index]) return;

  cart[index].quantity = (cart[index].quantity || 1) + delta;

  if (cart[index].quantity <= 0) {
    removeFromCart(index);
  } else {
    saveAndUpdateCart();
  }
};

// Globally accessible remove function
window.removeFromCart = (index) => {
  cart.splice(index, 1);
  saveAndUpdateCart();
};

function saveAndUpdateCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const container = document.getElementById("cart-items-container");
  const headerTotal = document.getElementById("header-total");
  const cartTotalPrice = document.getElementById("cart-total-price");

  if (!container) return;

  container.innerHTML = "";
  let total = 0;

  // Weekend surcharge logic (same as in product grid and checkout)
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  let isWeekend = false;
  if (
    (day === 5 && hour >= 15) || // Friday after 15:00
    day === 6 || // Saturday
    day === 0 || // Sunday
    (day === 1 && hour < 3) // Monday before 03:00
  ) {
    isWeekend = true;
  }

  // --- Bulk Discount Logic ---
  // 1. Calculate per-category quantities
  const categoryTotals = {};
  cart.forEach((item) => {
    const cat = item.category || "Other";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (item.quantity || 1);
  });
  // 2. Mark which categories get discount
  const bulkDiscountCategories = Object.keys(categoryTotals).filter(
    (cat) => categoryTotals[cat] >= 10,
  );
  // 3. Calculate total and discounts
  const bulkDiscounts = {};

  if (cart.length === 0) {
    container.innerHTML =
      "<p style='text-align:center; padding: 20px;'>Your cart is empty</p>";
    if (headerTotal) headerTotal.textContent = 0;
    if (cartTotalPrice) cartTotalPrice.textContent = 0;
    // Remove any discount/shipping summary if present
    const discountRow = document.getElementById("cart-discount-row");
    if (discountRow) discountRow.remove();
    const bulkDiscountRows = document.getElementById("cart-bulk-discount-rows");
    if (bulkDiscountRows) bulkDiscountRows.remove();
    const shippingRow = document.getElementById("cart-shipping-row");
    if (shippingRow) shippingRow.remove();
    return;
  }

  cart.forEach((item, index) => {
    const itemQuantity = item.quantity || 1;
    const itemPrice = isWeekend ? Math.round(item.price * 1.15) : item.price;
    let itemTotal = itemPrice * itemQuantity;
    // Bulk discount per item
    if (bulkDiscountCategories.includes(item.category)) {
      const discount = Math.round(itemTotal * 0.1);
      bulkDiscounts[item.category] =
        (bulkDiscounts[item.category] || 0) + discount;
      itemTotal -= discount;
    }
    total += itemTotal;

    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";
    cartItem.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-info" style="flex:1;">
        <h4>${item.name}</h4>
        <p>${itemPrice} SEK</p>
        <div class="quantity-controls" style="display:flex; align-items:center; gap:10px; margin-top:5px;">
          <button class="qty-btn" onclick="changeQuantity(${index}, -1)">-</button>
          <span>${itemQuantity}</span>
          <button class="qty-btn" onclick="changeQuantity(${index}, 1)">+</button>
        </div>
      </div>
      <button class="remove-item" onclick="removeFromCart(${index})">&times;</button>
    `;
    container.appendChild(cartItem);
  });

  // --- Monday Discount Logic ---
  let discount = 0;
  let discountedTotal = total;
  if (now.getDay() === 1 && now.getHours() < 10) {
    discount = Math.round(total * 0.1);
    discountedTotal = total - discount;
  }

  // --- Shipping Cost Logic ---
  // Calculate total number of items
  let totalItems = 0;
  cart.forEach((item) => {
    totalItems += item.quantity || 1;
  });

  // Calculate shipping cost (free shipping over 15 items)
  let shippingCost = 0;
  if (totalItems < 15) {
    shippingCost = 25 + Math.round(discountedTotal * 0.1);
  }

  // Calculate final total with shipping
  const finalTotal = discountedTotal + shippingCost;

  // Update totals in UI with visual feedback
  if (headerTotal) {
    const oldValue = headerTotal.textContent;
    headerTotal.textContent = finalTotal;

    // Trigger animation if value changed
    if (oldValue !== finalTotal.toString()) {
      headerTotal.parentElement.classList.add("cart-updated");
      setTimeout(() => {
        headerTotal.parentElement.classList.remove("cart-updated");
      }, 600);
    }
  }
  if (cartTotalPrice) {
    cartTotalPrice.textContent = finalTotal;
    cartTotalPrice.classList.add("total-updated");
    setTimeout(() => {
      cartTotalPrice.classList.remove("total-updated");
    }, 600);
  }

  // Display bulk discounts (per category)
  let bulkDiscountRows = document.getElementById("cart-bulk-discount-rows");
  if (bulkDiscountRows) bulkDiscountRows.remove();
  const hasBulkDiscounts = Object.keys(bulkDiscounts).length > 0;
  if (hasBulkDiscounts) {
    bulkDiscountRows = document.createElement("div");
    bulkDiscountRows.id = "cart-bulk-discount-rows";
    bulkDiscountRows.style = "margin-top:0.5rem;text-align:right;";
    Object.entries(bulkDiscounts).forEach(([cat, amount]) => {
      if (amount > 0) {
        const row = document.createElement("div");
        row.className = "cart-bulk-discount-row";
        row.style = "color:#1abc9c;font-weight:bold;";
        row.innerHTML = `10% bulk discount on ${cat}: -${amount} SEK`;
        bulkDiscountRows.appendChild(row);
      }
    });
    cartTotalPrice?.parentElement?.parentElement?.insertBefore(
      bulkDiscountRows,
      cartTotalPrice.parentElement.nextSibling,
    );
  }

  // Display Monday discount if active
  let discountRow = document.getElementById("cart-discount-row");
  if (discount > 0) {
    if (!discountRow) {
      discountRow = document.createElement("div");
      discountRow.id = "cart-discount-row";
      discountRow.style =
        "color:#1abc9c;font-weight:bold;margin-top:0.5rem;text-align:right;";
      cartTotalPrice?.parentElement?.parentElement?.insertBefore(
        discountRow,
        cartTotalPrice.parentElement.nextSibling,
      );
    }
    discountRow.innerHTML = `Monday morning discount: -${discount} SEK`;
  } else if (discountRow) {
    discountRow.remove();
  }

  // Show shipping row
  let shippingRow = document.getElementById("cart-shipping-row");
  if (!shippingRow) {
    shippingRow = document.createElement("div");
    shippingRow.id = "cart-shipping-row";
    shippingRow.style = "margin-top:0.5rem;text-align:right;";
    // Insert before the total row
    cartTotalPrice?.parentElement?.parentElement?.insertBefore(
      shippingRow,
      cartTotalPrice.parentElement,
    );
  }
  if (shippingCost > 0) {
    shippingRow.innerHTML = `Shipping: ${shippingCost} SEK`;
    shippingRow.style.color = "#555";
    shippingRow.style.fontWeight = "normal";
  } else {
    shippingRow.innerHTML = `Free shipping!`;
    shippingRow.style.color = "#1abc9c";
    shippingRow.style.fontWeight = "bold";
  }
}

// --- GLOBAL INACTIVITY TIMER FOR CART ---
let cartInactivityTimer = null;
const CART_INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 min

function startCartInactivityTimer() {
  if (cartInactivityTimer) clearTimeout(cartInactivityTimer);
  cartInactivityTimer = setTimeout(() => {
    cart = [];
    saveAndUpdateCart();
    alert("Your cart was reset after 15 minutes of inactivity.");
    // Notify overlays (like checkout) to update if open
    window.dispatchEvent(new CustomEvent("cart:cleared"));
  }, CART_INACTIVITY_TIMEOUT);
}

function resetCartInactivityTimer() {
  startCartInactivityTimer();
}

// Start timer on page load
startCartInactivityTimer();

// Reset timer on user activity (click, keydown, touch)
["click", "keydown", "touchstart"].forEach((evt) => {
  window.addEventListener(evt, resetCartInactivityTimer, true);
});

// --- INITIALIZATION & EVENT LISTENERS ---

document.addEventListener("DOMContentLoaded", () => {
  // Listen for cart clear event from checkout overlay
  window.addEventListener("cart:cleared", () => {
    cart = [];
    updateCartUI();
  });

  updateDisplay();
  updateCartUI();

  sortOrder?.addEventListener("change", updateDisplay);
  categoryFilter?.addEventListener("change", updateDisplay);

  productGrid?.addEventListener("click", (e) => {
    if (e.target.classList.contains("order-btn")) {
      addToCart(e.target.getAttribute("data-id"), e.target);
    }
  });

  // Bättre touch-stöd för cart-knapp och overlay (iPad/iOS fix)
  const addCartListeners = (el, fn) => {
    if (!el) return;
    el.addEventListener("click", fn);
    el.addEventListener(
      "touchstart",
      function (e) {
        e.preventDefault();
        fn();
      },
      { passive: false },
    );
  };
  addCartListeners(cartIndicator, toggleCart);
  addCartListeners(closeCartBtn, toggleCart);
  addCartListeners(cartOverlay, toggleCart);

  clearCartBtn?.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear your cart?")) {
      cart = [];
      saveAndUpdateCart();
      // Notify other overlays (like checkout) to update
      window.dispatchEvent(new CustomEvent("cart:cleared"));
    }
  });

  // Show checkout overlay instead of redirect
  checkoutBtn?.addEventListener("click", () => {
    if (cart.length > 0) {
      const overlay = document.getElementById("checkout-overlay");
      if (overlay) {
        overlay.style.display = "flex";
        // Always re-render cart summary when opening checkout
        import("./checkout.js").then((mod) => {
          mod.renderCheckoutCart();
        });
        // (Re-)initialize checkout overlay logic and cart
        initCheckoutOverlay();
      }
    } else {
      alert("Your cart is empty!");
    }
  });

  // Close checkout overlay
  const closeCheckoutBtn = document.getElementById("close-checkout");
  if (closeCheckoutBtn) {
    closeCheckoutBtn.addEventListener("click", () => {
      // Stop the checkout timer when closing
      stopCheckoutTimer();
      const overlay = document.getElementById("checkout-overlay");
      if (overlay) overlay.style.display = "none";
    });
  }

  window.addEventListener("scroll", () => {
    if (backToTopBtn) {
      backToTopBtn.style.display = window.scrollY > 300 ? "block" : "none";
    }
  });

  backToTopBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
