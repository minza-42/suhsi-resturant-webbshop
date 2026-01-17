/* src/main.js */

import { renderCheckoutCart, initCheckoutOverlay } from "./checkout.js";
// --- PRODUCT DATA ---
const products = [
  {
    id: "salmon-nigiri",
    name: "Salmon Nigiri",
    price: 149,
    rating: 4.5,
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

function createProductHTML({ id, name, price, rating, category, image }) {
  // Weekend surcharge logic (same as in checkout)
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
  const displayPrice = isWeekend ? Math.round(price * 1.15) : price;
  return `
    <article class="product-card">
      <img src="${image}" alt="${name}" loading="lazy">
      <div class="product-info">
        <h3>${name}</h3>
        <p class="category-tag">${category}</p>
        <p class="rating">Rating: ${rating} ⭐</p>
        <p class="price"><strong>${displayPrice} kr</strong></p>
      </div>
      <button class="order-btn" data-id="${id}">Add to Cart</button>
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

function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 1) + 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveAndUpdateCart();
}

// Globally accessible quantity changer
window.changeQuantity = function (index, delta) {
  if (!cart[index]) return;

  cart[index].quantity = (cart[index].quantity || 1) + delta;

  if (cart[index].quantity <= 0) {
    removeFromCart(index);
  } else {
    saveAndUpdateCart();
  }
};

// Globally accessible remove function
window.removeFromCart = function (index) {
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

  if (cart.length === 0) {
    container.innerHTML =
      "<p style='text-align:center; padding: 20px;'>Your cart is empty</p>";
    if (headerTotal) headerTotal.textContent = 0;
    if (cartTotalPrice) cartTotalPrice.textContent = 0;
    // Remove any discount summary if present
    const discountRow = document.getElementById("cart-discount-row");
    if (discountRow) discountRow.remove();
    return;
  }

  cart.forEach((item, index) => {
    const itemQuantity = item.quantity || 1;
    const itemPrice = isWeekend ? Math.round(item.price * 1.15) : item.price;
    total += itemPrice * itemQuantity;

    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";
    cartItem.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-info" style="flex:1;">
        <h4>${item.name}</h4>
        <p>${itemPrice} kr</p>
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
  // Use the 'now' variable already declared above
  if (now.getDay() === 1 && now.getHours() < 10) {
    discount = Math.round(total * 0.1);
    discountedTotal = total - discount;
  }

  // Update totals in UI
  if (headerTotal) headerTotal.textContent = discountedTotal;
  if (cartTotalPrice) cartTotalPrice.textContent = discountedTotal;

  // Show discount row if discount is active
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
    discountRow.innerHTML = `Monday morning discount: -${discount} kr`;
  } else if (discountRow) {
    discountRow.remove();
  }
}

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
      addToCart(e.target.getAttribute("data-id"));
    }
  });

  cartIndicator?.addEventListener("click", toggleCart);
  closeCartBtn?.addEventListener("click", toggleCart);
  cartOverlay?.addEventListener("click", toggleCart);

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
