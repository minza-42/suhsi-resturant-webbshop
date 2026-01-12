/**
 * PRODUCT DATA
 * Exported to keep the file structure clean and modular.
 */
const products = [
  {
    id: "salmon-nigiri",
    name: "Salmon Nigiri",
    price: 149,
    rating: 4.5,
    category: "Nigiri",
    image: "img/salmon-nigiri.png",
  },
  {
    id: "avocado-nigiri",
    name: "Avocado Nigiri",
    price: 129,
    rating: 4.3,
    category: "Nigiri",
    image: "img/avocado-nigiri.png",
  },
  {
    id: "shrimp-nigiri",
    name: "Shrimp Nigiri",
    price: 139,
    rating: 3.8,
    category: "Nigiri",
    image: "img/shrimp-nigiri.png",
  },
  {
    id: "tuna-nigiri",
    name: "Tuna Nigiri",
    price: 159,
    rating: 4.2,
    category: "Nigiri",
    image: "img/tuna-nigiri.png",
  },
  {
    id: "california-roll",
    name: "California Maki",
    price: 129,
    rating: 4.0,
    category: "Maki",
    image: "img/california-maki.png",
  },
  {
    id: "spicy-tuna-roll",
    name: "Spicy Tuna Roll",
    price: 139,
    rating: 4.8,
    category: "Maki",
    image: "img/spicy-tuna.png",
  },
  {
    id: "dragon-roll",
    name: "Dragon Roll",
    price: 169,
    rating: 5.0,
    category: "Maki",
    image: "img/dragon-roll.png",
  },
  {
    id: "tempura-roll",
    name: "Tempura Shrimp Roll",
    price: 139,
    rating: 4.6,
    category: "Maki",
    image: "img/tempura-roll.png",
  },
  {
    id: "salmon-sashimi",
    name: "Salmon Sashimi",
    price: 195,
    rating: 4.9,
    category: "Sashimi",
    image: "img/salmon-sashimi.png",
  },
  {
    id: "mixed-sashimi",
    name: "Large Sashimi Mix",
    price: 279,
    rating: 4.7,
    category: "Sashimi",
    image: "img/sashimi-mix.png",
  },
  {
    id: "ramen-pork-broth",
    name: "Ramen Pork Broth",
    price: 169,
    rating: 4.7,
    category: "Ramen",
    image: "img/ramen-pork-broth.png",
  },
  {
    id: "dumpling-xiao-long-bao",
    name: "Xiao Long Bao",
    price: 159,
    rating: 4.7,
    category: "Dumplings",
    image: "img/dumpling-xiao-long-bao.png",
  },
  {
    id: "dumpling-gyoza",
    name: "Gyoza Dumplings",
    price: 149,
    rating: 4.7,
    category: "Dumplings",
    image: "img/dumpling-gyoza.png",
  },
];

// --- SELECTORS ---
const productGrid = document.getElementById("product-grid");
const categoryFilter = document.getElementById("category-filter");
const sortOrder = document.getElementById("sort-order");
const backToTopBtn = document.getElementById("backToTop");

// Global Cart State
let cart = [];

/**
 * Renders the product cards to the grid.
 * Creates HTML elements dynamically and attaches event listeners.
 */
function renderProducts(items) {
  // Clear the grid before rendering new items
  productGrid.innerHTML = "";

  items.forEach((product) => {
    const article = document.createElement("article");
    article.className = "product-card";

    article.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="category-tag">${product.category}</p>
        <p class="rating">Rating: ${product.rating} ⭐</p>
        <p class="price"><strong>${product.price} kr</strong></p>
      </div>
      <button class="order-btn" data-id="${product.id}">Add to Cart</button>
    `;

    // Append the created article to the product grid
    productGrid.appendChild(article);
  });

  // Re-attach listeners to the newly created "Add to Cart" buttons
  attachCartListeners();
}

/**
 * Handles the logic for the "Add to Cart" buttons.
 */
function attachCartListeners() {
  document.querySelectorAll(".order-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const productId = e.target.getAttribute("data-id");
      addToCart(productId);
    });
  });
}

/**
 * Combined Logic for Filtering and Sorting.
 * Triggered whenever a filter or sort option changes.
 */
function updateDisplay() {
  let filteredItems = [...products];

  // 1. Filter by Category
  const category = categoryFilter.value;
  if (category !== "all") {
    filteredItems = filteredItems.filter((item) => item.category === category);
  }

  // 2. Sort Items
  const sortType = sortOrder.value;

  if (sortType === "price-low") {
    filteredItems.sort((a, b) => a.price - b.price);
  } else if (sortType === "price-high") {
    filteredItems.sort((a, b) => b.price - a.price);
  } else if (sortType === "rating") {
    filteredItems.sort((a, b) => b.rating - a.rating);
  } else if (sortType === "name") {
    filteredItems.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Update the UI
  renderProducts(filteredItems);
}

// --- EVENT LISTENERS ---

// Listen for changes in sorting and filtering
sortOrder.addEventListener("change", updateDisplay);
categoryFilter.addEventListener("change", updateDisplay);

// Show/Hide "Back to Top" button on scroll
window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  // Show button after scrolling down 300px
  if (
    document.body.scrollTop > 300 ||
    document.documentElement.scrollTop > 300
  ) {
    if (backToTopBtn) backToTopBtn.style.display = "block";
  } else {
    if (backToTopBtn) backToTopBtn.style.display = "none";
  }
}

// Smooth scroll to top when button is clicked
if (backToTopBtn) {
  backToTopBtn.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

/**
 * Placeholder for adding items to cart
 */
function addToCart(productId) {
  console.log(`Product ${productId} added to cart.`);
  // You can add your logic here to push to the 'cart' array
}

// Initial render to populate the page on load
updateDisplay();
