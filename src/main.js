/* src/main.js */
/* jshint esversion: 11 */

import { initCheckoutOverlay, stopCheckoutTimer } from "./checkout.js";

import {
  applyDiscountCode,
  removeDiscountCode,
  calculateCartTotal,
  buildDiscountInfoHTML,
  isWeekendSurcharge,
} from "./discounts.js";

// --- PRODUCT DATA ---
const products = [
  {
    id: "salmon-nigiri",
    name: "Salmon Nigiri",
    price: 149,
    rating: 5.0,
    category: "Nigiri",
    image: "img/salmon-nigiri.webp",
  },
  {
    id: "avocado-nigiri",
    name: "Avocado Nigiri",
    price: 129,
    rating: 4.3,
    category: "Nigiri",
    image: "img/avocado-nigiri.webp",
  },
  {
    id: "shrimp-nigiri",
    name: "Shrimp Nigiri",
    price: 139,
    rating: 3.8,
    category: "Nigiri",
    image: "img/shrimp-nigiri.webp",
  },
  {
    id: "tuna-nigiri",
    name: "Tuna Nigiri",
    price: 159,
    rating: 4.4,
    category: "Nigiri",
    image: "img/tuna-nigiri.webp",
  },
  {
    id: "california-roll",
    name: "California Maki",
    price: 129,
    rating: 4.0,
    category: "Maki",
    image: "img/california-maki.webp",
  },
  {
    id: "spicy-tuna-roll",
    name: "Spicy Tuna Roll",
    price: 139,
    rating: 4.8,
    category: "Maki",
    image: "img/spicy-tuna.webp",
  },
  {
    id: "dragon-roll",
    name: "Dragon Roll",
    price: 169,
    rating: 5.0,
    category: "Maki",
    image: "img/dragon-roll.webp",
  },
  {
    id: "tempura-roll",
    name: "Tempura Shrimp Roll",
    price: 139,
    rating: 4.6,
    category: "Maki",
    image: "img/tempura-roll.webp",
  },
  {
    id: "salmon-sashimi",
    name: "Salmon Sashimi",
    price: 195,
    rating: 4.9,
    category: "Sashimi",
    image: "img/salmon-sashimi.webp",
  },
  {
    id: "mixed-sashimi",
    name: "Large Sashimi Mix",
    price: 279,
    rating: 4.7,
    category: "Sashimi",
    image: "img/sashimi-mix.webp",
  },
  {
    id: "ramen-pork-broth",
    name: "Ramen Pork Broth",
    price: 169,
    rating: 4.7,
    category: "Ramen",
    image: "img/ramen-pork-broth.webp",
  },
  {
    id: "dumpling-xiao-long-bao",
    name: "Xiao Long Bao",
    price: 159,
    rating: 4.7,
    category: "Dumplings",
    image: "img/dumpling-xiao-long-bao.webp",
  },
  {
    id: "dumpling-gyoza",
    name: "Gyoza Dumplings",
    price: 149,
    rating: 4.7,
    category: "Dumplings",
    image: "img/dumpling-gyoza.webp",
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
const MAX_QUANTITY = 20;

function createProductHTML({ id, name, price, rating, category, image }) {
  const isWeekend = isWeekendSurcharge();
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

  quantityInput.value = 1;

  if (buttonElement) {
    createFlyToCartAnimation(buttonElement);
  }

  saveAndUpdateCart();
}

function createFlyToCartAnimation(buttonElement) {
  const buttonRect = buttonElement.getBoundingClientRect();
  const cartIcon = document.getElementById("cart-indicator");
  const cartRect = cartIcon.getBoundingClientRect();

  const flyingItem = document.createElement("div");
  flyingItem.className = "flying-cart-item";
  flyingItem.innerHTML = "🍣";
  flyingItem.style.left = buttonRect.left + buttonRect.width / 2 + "px";
  flyingItem.style.top = buttonRect.top + buttonRect.height / 2 + "px";

  document.body.appendChild(flyingItem);

  const deltaX = cartRect.left - buttonRect.left;
  const deltaY = cartRect.top - buttonRect.top;

  setTimeout(() => {
    flyingItem.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.3)`;
    flyingItem.style.opacity = "0";
  }, 10);

  setTimeout(() => {
    flyingItem.remove();
  }, 800);

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
    window.removeFromCart(index);
  } else {
    saveAndUpdateCart();
  }
};

// Update quantity from direct input in cart
window.updateQuantityFromInput = (index, newValue) => {
  if (!cart[index]) return;

  let quantity = parseInt(newValue) || 1;

  if (quantity < 1) {
    quantity = 1;
  } else if (quantity > MAX_QUANTITY) {
    alert(`Maximum limit is ${MAX_QUANTITY} per item.`);
    quantity = MAX_QUANTITY;
  }

  cart[index].quantity = quantity;
  saveAndUpdateCart();
};

// Globally accessible remove function
window.removeFromCart = (index) => {
  cart.splice(index, 1);
  saveAndUpdateCart();
};

// Make discount functions globally accessible
window.applyDiscountCode = (code) => {
  const result = applyDiscountCode(code);
  saveAndUpdateCart();
  return result;
};

window.removeDiscountCode = () => {
  removeDiscountCode();
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

  if (cart.length === 0) {
    container.innerHTML =
      "<p style='text-align:center; padding: 20px; color: #999;'>Your cart is empty</p>";
    if (headerTotal) headerTotal.textContent = 0;
    if (cartTotalPrice) cartTotalPrice.textContent = 0;

    const discountInfoContainer = document.querySelector(".cart-discount-info");
    if (discountInfoContainer) discountInfoContainer.innerHTML = "";

    return;
  }

  const isWeekend = isWeekendSurcharge();

  // Render cart items
  cart.forEach((item, index) => {
    const itemQuantity = item.quantity || 1;
    const itemPrice = isWeekend ? Math.round(item.price * 1.15) : item.price;

    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";
    cartItem.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p class="cart-item-price">${itemPrice} SEK</p>
        <div class="quantity-controls">
          <button class="qty-btn" onclick="changeQuantity(${index}, -1)" aria-label="Decrease quantity">−</button>
          <input 
            type="number" 
            class="qty-input-cart" 
            value="${itemQuantity}" 
            min="1" 
            max="${MAX_QUANTITY}"
            onchange="updateQuantityFromInput(${index}, this.value)"
            aria-label="Quantity for ${item.name}"
          >
          <button class="qty-btn" onclick="changeQuantity(${index}, 1)" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <button class="remove-item" onclick="removeFromCart(${index})" aria-label="Remove ${item.name} from cart">×</button>
    `;
    container.appendChild(cartItem);
  });

  // Calculate all discounts and totals using discounts.js
  const totals = calculateCartTotal(cart);

  // Build discount info HTML
  const discountInfoHTML = buildDiscountInfoHTML(totals);

  // Insert discount info into container
  let discountInfoContainer = document.querySelector(".cart-discount-info");
  if (!discountInfoContainer) {
    discountInfoContainer = document.createElement("div");
    discountInfoContainer.className = "cart-discount-info";
    const footer = document.querySelector(".cart-footer");
    const totalRow = document.querySelector(".total-row");
    if (footer && totalRow) {
      footer.insertBefore(discountInfoContainer, totalRow);
    }
  }
  discountInfoContainer.innerHTML = discountInfoHTML;

  // Update totals in UI with visual feedback
  if (headerTotal) {
    const oldValue = headerTotal.textContent;
    headerTotal.textContent = totals.finalTotal;

    if (oldValue !== totals.finalTotal.toString()) {
      headerTotal.parentElement.classList.add("cart-updated");
      setTimeout(() => {
        headerTotal.parentElement.classList.remove("cart-updated");
      }, 600);
    }
  }

  if (cartTotalPrice) {
    cartTotalPrice.textContent = totals.finalTotal;
    cartTotalPrice.classList.add("total-updated");
    setTimeout(() => {
      cartTotalPrice.classList.remove("total-updated");
    }, 600);
  }
}

// --- GLOBAL INACTIVITY TIMER FOR CART ---
let cartInactivityTimer = null;
const CART_INACTIVITY_TIMEOUT = 15 * 60 * 1000;

function startCartInactivityTimer() {
  if (cartInactivityTimer) clearTimeout(cartInactivityTimer);
  cartInactivityTimer = setTimeout(() => {
    cart = [];
    saveAndUpdateCart();
    alert("Your cart was reset after 15 minutes of inactivity.");
    window.dispatchEvent(new CustomEvent("cart:cleared"));
  }, CART_INACTIVITY_TIMEOUT);
}

function resetCartInactivityTimer() {
  startCartInactivityTimer();
}

startCartInactivityTimer();

["click", "keydown", "touchstart"].forEach((evt) => {
  window.addEventListener(evt, resetCartInactivityTimer, true);
});

// --- INITIALIZATION & EVENT LISTENERS ---

document.addEventListener("DOMContentLoaded", () => {
  window.addEventListener("cart:cleared", () => {
    cart = [];
    removeDiscountCode();
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

  // Discount code handler
  const cartDiscountInput = document.getElementById("cart-discount-input");
  const cartApplyDiscountBtn = document.getElementById(
    "cart-apply-discount-btn",
  );
  const cartDiscountFeedback = document.getElementById(
    "cart-discount-feedback",
  );

  if (cartApplyDiscountBtn && cartDiscountInput && cartDiscountFeedback) {
    cartApplyDiscountBtn.addEventListener("click", () => {
      const code = cartDiscountInput.value;
      const result = window.applyDiscountCode(code);

      cartDiscountFeedback.textContent = result.message;
      cartDiscountFeedback.className = `discount-feedback ${result.success ? "success" : "error"}`;

      if (result.success) {
        cartDiscountInput.value = "";
      }
    });

    cartDiscountInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        cartApplyDiscountBtn.click();
      }
    });
  }

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
      removeDiscountCode();
      saveAndUpdateCart();
      window.dispatchEvent(new CustomEvent("cart:cleared"));
    }
  });

  checkoutBtn?.addEventListener("click", () => {
    if (cart.length > 0) {
      const overlay = document.getElementById("checkout-overlay");
      if (overlay) {
        overlay.style.display = "flex";
        import("./checkout.js").then((mod) => {
          mod.renderCheckoutCart();
        });
        initCheckoutOverlay();
      }
    } else {
      alert("Your cart is empty!");
    }
  });

  const closeCheckoutBtn = document.getElementById("close-checkout");
  if (closeCheckoutBtn) {
    closeCheckoutBtn.addEventListener("click", () => {
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
