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

// Global State
let cart = [];

/**
 * Creates an HTML string for a single product.
 * Separating the HTML generation makes the code easier to maintain.
 * @param {Product} product
 * @returns {string}
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
 * Renders the product cards to the grid.
 * @param {Product[]} items
 */
function renderProducts(items) {
  if (!productGrid) return;

  // Using .map().join('') is often more performant than multiple appendChild calls
  productGrid.innerHTML = items
    .map((product) => createProductHTML(product))
    .join("");
}

/**
 * Combined Logic for Filtering and Sorting.
 */
function updateDisplay() {
  const selectedCategory = categoryFilter?.value;
  const selectedSort = sortOrder?.value;

  // Chain filter and sort for cleaner logic
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

// --- EVENT DELEGATION ---
// Instead of re-attaching listeners every time we render,
// we listen on the parent (productGrid).
productGrid?.addEventListener("click", (e) => {
  if (e.target.classList.contains("order-btn")) {
    const productId = e.target.getAttribute("data-id");
    addToCart(productId);
  }
});

// --- UI HELPERS ---
const handleScroll = () => {
  const isPastThreshold = window.scrollY > 300;
  if (backToTopBtn) {
    backToTopBtn.style.display = isPastThreshold ? "block" : "none";
  }
};

// --- LISTENERS ---
sortOrder?.addEventListener("change", updateDisplay);
categoryFilter?.addEventListener("change", updateDisplay);
window.addEventListener("scroll", handleScroll);

backToTopBtn?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/**
 * Adds a product to the cart state.
 * @param {string} productId
 */
function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (product) {
    cart.push({ ...product, addedAt: Date.now() });
    console.log(`Added ${product.name} to cart. Total items: ${cart.length}`);
  }
}

// Initial render
updateDisplay();
