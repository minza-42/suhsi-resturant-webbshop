// --- 1. CART RENDERING LOGIC ---
function renderCheckoutCart() {
  // Retrieve cart from localStorage
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const container = document.getElementById("checkout-cart-items");
  const submitBtn = document.getElementById("submit-btn");

  if (!container) return;

  // Display message if cart is empty
  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    if (submitBtn) submitBtn.style.opacity = "0.5";
    return;
  }

  let total = 0;
  // Map through cart items to create HTML
  const cartHtml = cart
    .map((item) => {
      total += item.price;
      return `
      <div class="cart-item" style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem; border-bottom:1px solid #eee; padding-bottom:0.5rem;">
        <img src="${item.image}" alt="${
        item.name
      }" width="48" height="48" style="border-radius:8px; object-fit:cover;">
        <div style="flex:1;">
          <strong>${item.name}</strong><br>
          <span style="font-size:0.85em; opacity: 0.8;">${
            item.category || ""
          }</span>
        </div>
        <span>${item.price} kr</span>
      </div>`;
    })
    .join("");

  // Inject items and final total
  container.innerHTML =
    cartHtml +
    `<div style="text-align:right; font-weight:bold; margin-top:1rem; font-size:1.1rem;">
      Total: ${total} kr
    </div>`;
}

// --- 2. FORM & VALIDATION LOGIC ---
const form = document.getElementById("checkout-form");
const submitBtn = document.getElementById("submit-btn");
const resetBtn = document.getElementById("reset-btn");
const paymentRadios = document.getElementsByName("payment");
const cardFields = document.getElementById("card-fields");
const invoiceFields = document.getElementById("invoice-fields");
const ssnInput = document.getElementById("ssn");
const gdprCheckbox = document.getElementById("gdpr");

// Toggle fields based on payment choice
function updatePaymentFields() {
  const payment = Array.from(paymentRadios).find((r) => r.checked)?.value;
  if (payment === "invoice") {
    invoiceFields.style.display = "block";
    cardFields.style.display = "none";
    ssnInput.required = true; // SSN is required for invoice
  } else {
    invoiceFields.style.display = "none";
    cardFields.style.display = "block";
    ssnInput.required = false;
  }
}

/**
 * Updates the custom error messages below each input field
 * Uses English text regardless of browser language
 */
function updateErrorMessages() {
  const inputs = [
    "firstName",
    "lastName",
    "email",
    "address",
    "zip",
    "city",
    "phone",
    "gdpr",
    "ssn",
  ];

  inputs.forEach((id) => {
    const input = document.getElementById(id);
    const errorSpan = document.getElementById(`error-${id}`);

    if (input && errorSpan) {
      if (!input.checkValidity()) {
        // Validation logic for different error types
        if (input.validity.valueMissing) {
          errorSpan.textContent = "This field is required.";
        } else if (input.validity.typeMismatch) {
          errorSpan.textContent =
            "Please enter a valid email address (e.g., name@example.com).";
        } else if (input.validity.patternMismatch) {
          // Uses the 'title' attribute from HTML as the error message
          errorSpan.textContent = input.title || "Invalid format.";
        }
      } else {
        // Clear message if field is valid
        errorSpan.textContent = "";
      }
    }
  });
}

// --- 3. INITIALIZATION ---
renderCheckoutCart();
updatePaymentFields();

// --- 4. EVENT LISTENERS ---

// Payment method toggle
paymentRadios.forEach((radio) => {
  radio.addEventListener("change", updatePaymentFields);
});

// Update error messages in real-time as user types
form.addEventListener("input", updateErrorMessages);

// Handle form submission
form.addEventListener("submit", (e) => {
  // Check if browser validation (like @ in email) passes
  if (!form.checkValidity()) {
    e.preventDefault(); // Stop submission
    updateErrorMessages(); // Show our English error texts
    return;
  }

  // Check if cart is empty
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  if (cart.length === 0) {
    e.preventDefault();
    alert("Your cart is empty. Please add products before checking out.");
    return;
  }

  // Successful order
  e.preventDefault();
  alert("Thank you for your order! Your sushi is on its way.");
  localStorage.removeItem("cart");
  window.location.href = "index.html";
});

// Clear Order Button
resetBtn.addEventListener("click", () => {
  // Timeout ensures the browser's native reset finishes first
  setTimeout(() => {
    localStorage.removeItem("cart");
    renderCheckoutCart();
    // Clear all visual error messages
    document
      .querySelectorAll(".error-message")
      .forEach((el) => (el.textContent = ""));
  }, 0);
});
