/* src/checkout.js */

// Run when the module loads
// No DOMContentLoaded wrapper needed for type="module"

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
    if (submitBtn) submitBtn.disabled = true;
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
    `
    <div style="text-align:right; font-weight:bold; margin-top:1rem; font-size:1.1rem;">
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
  } else {
    invoiceFields.style.display = "none";
    cardFields.style.display = "block";
  }
  validateForm();
}

// Validate all inputs
function validateForm() {
  let isValid = true;
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  // Invalid if cart is empty
  if (cart.length === 0) isValid = false;

  // Check required fields
  const requiredIds = [
    "firstName",
    "lastName",
    "address",
    "zip",
    "city",
    "phone",
    "email",
  ];
  requiredIds.forEach((id) => {
    const input = document.getElementById(id);
    if (!input || !input.value.trim()) isValid = false;
  });

  // GDPR check
  if (!gdprCheckbox.checked) isValid = false;

  // SSN check for invoice
  const payment = Array.from(paymentRadios).find((r) => r.checked)?.value;
  if (payment === "invoice") {
    const ssnValue = ssnInput.value.replace(/\D/g, "");
    if (ssnValue.length < 10) isValid = false;
  }

  submitBtn.disabled = !isValid;
  return isValid;
}

// --- 3. INITIALIZATION ---
renderCheckoutCart();
updatePaymentFields();

// --- 4. EVENT LISTENERS ---

// Re-validate on any input
form.addEventListener("input", validateForm);

// Payment method toggle
paymentRadios.forEach((radio) => {
  radio.addEventListener("change", updatePaymentFields);
});

// Submit order
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (validateForm()) {
    alert("Thank you for your order!");
    localStorage.removeItem("cart");
    window.location.href = "index.html";
  }
});

// Clear Order (The Fix)
resetBtn.addEventListener("click", () => {
  // Timeout ensures the browser's native reset finishes first
  setTimeout(() => {
    localStorage.removeItem("cart"); // Clear storage
    renderCheckoutCart(); // Update UI
    validateForm(); // Disable submit button

    // Clear visual errors
    document
      .querySelectorAll(".error-message")
      .forEach((el) => (el.textContent = ""));
    console.log("Order and cart cleared.");
  }, 0);
});
