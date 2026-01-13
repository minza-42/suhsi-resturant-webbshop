// Clear cart button logic
document.addEventListener("DOMContentLoaded", () => {
  const clearCartBtn = document.getElementById("clear-cart-btn");
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      cart = [];
      localStorage.removeItem("cart");
      updateCartUI();
    });
  }
});
// --- CHECKOUT BUTTON REDIRECT ---
document.addEventListener("DOMContentLoaded", () => {
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      window.location.href = "checkout.html";
    });
  }
});
/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {number} price
 * @property {number} rating
 * @property {string} category
 * @property {string} image
 */

/** @type {Product[]} */
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
const cartItemsContainer = document.getElementById("cart-items-container");
const cartTotalPrice = document.getElementById("cart-total-price");
const headerTotal = document.getElementById("header-total");

// --- GLOBAL STATE ---
let cart = [];
// Load cart from localStorage if available
try {
  const savedCart = localStorage.getItem("cart");
  if (savedCart) cart = JSON.parse(savedCart);
} catch (e) {}

// --- PRODUCT RENDERING ---

/**
 * Creates HTML for a product card
 */
function createProductHTML({ id, name, price, rating, category, image }) {
  return `
    <article class="product-card">
      <img src="${image}" alt="${name}" loading="lazy">
      <div class="product-info">
        <h3>${name}</h3>
        <p class="category-tag">${category}</p>
        <p class="rating">Rating: ${rating} ⭐</p>
        <p class="price"><strong>${price} kr</strong></p>
      </div>
      <button class="order-btn" data-id="${id}">Add to Cart</button>
    </article>
  `;
}

/**
 * Renders products to the DOM
 */
function renderProducts(items) {
  if (!productGrid) return;
  productGrid.innerHTML = items
    .map((product) => createProductHTML(product))
    .join("");
}

/**
 * Filters and sorts products based on user selection
 */
function updateDisplay() {
  const selectedCategory = categoryFilter?.value;
  const selectedSort = sortOrder?.value;

  const filteredItems = products
    .filter(
      (item) => selectedCategory === "all" || item.category === selectedCategory
    )
    .sort((a, b) => {
      switch (selectedSort) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  renderProducts(filteredItems);
}

// --- CART LOGIC ---

/**
 * Opens or closes the cart drawer
 */
function toggleCart() {
  cartDrawer?.classList.toggle("active");
  cartOverlay?.classList.toggle("active");
}

/**
 * Adds an item to the global cart array
 */
function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (product) {
    cart.push({ ...product, cartItemId: Date.now() });
    updateCartUI();
  }
}

/**
 * Updates all UI elements related to the cart
 */
function updateCartUI() {
  // 1. Calculate and update totals
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  if (headerTotal) headerTotal.innerText = total;
  if (cartTotalPrice) cartTotalPrice.innerText = total;

  // Save cart to localStorage
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
  } catch (e) {}

  // 2. Render items inside the drawer
  if (cartItemsContainer) {
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = "<p>Your cart is empty</p>";
    } else {
      cartItemsContainer.innerHTML = cart
        .map(
          (item) => `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img" width="48" height="48" loading="lazy" />
            <div>
              <strong>${item.name}</strong>
              <p>${item.category}</p>
            </div>
            <span>${item.price} kr</span>
          </div>
        `
        )
        .join("");
    }
  }
}

// --- EVENT LISTENERS ---

// Sort and Filter Change
sortOrder?.addEventListener("change", updateDisplay);
categoryFilter?.addEventListener("change", updateDisplay);

// Add to Cart (using Event Delegation on the grid)
productGrid?.addEventListener("click", (e) => {
  if (e.target.classList.contains("order-btn")) {
    const productId = e.target.getAttribute("data-id");
    addToCart(productId);
  }
});

// Cart Drawer Toggles
cartIndicator?.addEventListener("click", toggleCart);
closeCartBtn?.addEventListener("click", toggleCart);
cartOverlay?.addEventListener("click", toggleCart);

// Back to Top Scroll Logic
const handleScroll = () => {
  const isPastThreshold = window.scrollY > 300;
  if (backToTopBtn) {
    backToTopBtn.style.display = isPastThreshold ? "block" : "none";
  }
};

window.addEventListener("scroll", handleScroll);
backToTopBtn?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// --- INITIALIZATION ---

// Initial product render
updateDisplay();

// Extra dynamic content (optional)
const dynamicContainer = document.createElement("div");
dynamicContainer.className = "dynamic-box";
document.body.appendChild(dynamicContainer);
