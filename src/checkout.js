/* src/checkout.js */

// --- CHECKOUT TIMEOUT LOGIC ---
let checkoutTimer = null;
const CHECKOUT_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

// --- DISCOUNT CODE LOGIC ---
const DISCOUNT_CODES = {
  SUSHI10: 0.1, // 10% discount
  SUSHI20: 0.2, // 20% discount
};

let appliedDiscountCode = null;
let discountCodeAmount = 0;

// Function to validate and apply discount code
function applyDiscountCode(code) {
  const upperCode = code.trim().toUpperCase();

  if (DISCOUNT_CODES[upperCode]) {
    appliedDiscountCode = upperCode;
    return DISCOUNT_CODES[upperCode];
  }

  return null;
}

// --- 1. CART RENDERING LOGIC ---
export function renderCheckoutCart() {
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

  // --- Weekend Surcharge Logic (hidden from customer) ---
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
  let total = 0;
  const bulkDiscounts = {};
  cart.forEach((item) => {
    const itemQuantity = item.quantity || 1;
    const itemPrice = isWeekend ? Math.round(item.price * 1.15) : item.price;
    let itemTotal = itemPrice * itemQuantity;
    // Apply 10% discount if this item's category qualifies
    if (bulkDiscountCategories.includes(item.category)) {
      const discount = Math.round(itemTotal * 0.1);
      bulkDiscounts[item.category] =
        (bulkDiscounts[item.category] || 0) + discount;
      itemTotal -= discount;
    }
    total += itemTotal;
  });

  // 4. Render cart items (showing original price, but discount is shown below)
  const cartHtml = cart
    .map((item) => {
      const itemQuantity = item.quantity || 1;
      const itemPrice = isWeekend ? Math.round(item.price * 1.15) : item.price;
      let itemTotal = itemPrice * itemQuantity;
      let discount = 0;
      if (bulkDiscountCategories.includes(item.category)) {
        discount = Math.round(itemTotal * 0.1);
        itemTotal -= discount;
      }
      return `
    <div class="cart-item" style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem; border-bottom:1px solid #eee; padding-bottom:0.5rem;">
      <img src="${item.image}" alt="${item.name}" width="48" height="48" style="border-radius:8px; object-fit:cover;">
      <div style="flex:1;">
        <strong>${item.name}</strong><br>
        <span style="font-size:0.85em; opacity: 0.8;">${item.category || ""}</span><br>
        <span style="font-size:0.95em; color:#888;">Quantity: ${itemQuantity}</span>
      </div>
      <span>${itemTotal} SEK</span>
    </div>`;
    })
    .join("");

  // --- Monday Discount Logic ---
  let mondayDiscount = 0;
  let discountedTotal = total;
  if (now.getDay() === 1 && now.getHours() < 10) {
    mondayDiscount = Math.round(total * 0.1);
    discountedTotal = total - mondayDiscount;
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

  // Calculate subtotal with shipping
  let subtotal = discountedTotal + shippingCost;

  // --- Apply Discount Code ---
  discountCodeAmount = 0;
  if (appliedDiscountCode && DISCOUNT_CODES[appliedDiscountCode]) {
    discountCodeAmount = Math.round(
      subtotal * DISCOUNT_CODES[appliedDiscountCode],
    );
  }

  // Calculate final total
  const finalTotal = subtotal - discountCodeAmount;

  // 5. Render discount rows for bulk discount
  let bulkDiscountRows = "";
  Object.entries(bulkDiscounts).forEach(([cat, amount]) => {
    if (amount > 0) {
      bulkDiscountRows += `<div class="checkout-discount-row" style="color:#1abc9c;font-weight:bold;margin-top:0.5rem;text-align:right;">10% bulk discount on ${cat}: -${amount} SEK</div>`;
    }
  });

  // Inject items and final total
  container.innerHTML =
    cartHtml +
    bulkDiscountRows +
    (mondayDiscount > 0
      ? `<div id="checkout-discount-row" style="color:#1abc9c;font-weight:bold;margin-top:1rem;text-align:right;">Monday morning discount: -${mondayDiscount} SEK</div>`
      : "") +
    (shippingCost > 0
      ? `<div style="text-align:right; margin-top:0.5rem; color:#555;">Shipping: ${shippingCost} SEK</div>`
      : `<div style="text-align:right; margin-top:0.5rem; color:#1abc9c;font-weight:bold;">Free shipping!</div>`) +
    (discountCodeAmount > 0
      ? `<div id="discount-code-row" style="color:#1abc9c;font-weight:bold;margin-top:0.5rem;text-align:right;">Discount code ${appliedDiscountCode}: -${discountCodeAmount} SEK</div>`
      : "") +
    `<div style="text-align:right; font-weight:bold; margin-top:0.5rem; font-size:1.1rem;">
      Total: ${finalTotal} SEK
    </div>`;
}

// --- 2. FORM & VALIDATION LOGIC ---
let form,
  _submitBtn,
  resetBtn,
  paymentRadios,
  cardFields,
  invoiceFields,
  ssnInput,
  _gdprCheckbox;

// Toggle fields based on payment choice and cart total
function updatePaymentFields() {
  if (!paymentRadios || !invoiceFields || !cardFields || !ssnInput) return;

  // Calculate cart total (with surcharge/discount)
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  let isWeekend = false;
  if (
    (day === 5 && hour >= 15) ||
    day === 6 ||
    day === 0 ||
    (day === 1 && hour < 3)
  ) {
    isWeekend = true;
  }
  let total = 0;
  cart.forEach((item) => {
    const itemQuantity = item.quantity || 1;
    const itemPrice = isWeekend ? Math.round(item.price * 1.15) : item.price;
    total += itemPrice * itemQuantity;
  });
  // Monday morning discount
  if (now.getDay() === 1 && now.getHours() < 10) {
    total = total - Math.round(total * 0.1);
  }

  // Add shipping cost to total
  let totalItems = 0;
  cart.forEach((item) => {
    totalItems += item.quantity || 1;
  });
  let shippingCost = 0;
  if (totalItems < 15) {
    shippingCost = 25 + Math.round(total * 0.1);
  }
  total += shippingCost;

  // Apply discount code to total for invoice check
  if (appliedDiscountCode && DISCOUNT_CODES[appliedDiscountCode]) {
    const codeDiscount = Math.round(
      total * DISCOUNT_CODES[appliedDiscountCode],
    );
    total -= codeDiscount;
  }

  // Disable invoice if total > 800 and show message
  const invoiceRadio = Array.from(paymentRadios).find(
    (r) => r.value === "invoice",
  );
  let invoiceMsg = document.getElementById("invoice-limit-msg");
  if (invoiceRadio) {
    if (total > 800) {
      invoiceRadio.disabled = true;
      // If invoice was selected, switch to card
      if (invoiceRadio.checked) {
        const cardRadio = Array.from(paymentRadios).find(
          (r) => r.value === "card",
        );
        if (cardRadio) cardRadio.checked = true;
      }
      // Show message if not already present
      if (!invoiceMsg) {
        invoiceMsg = document.createElement("div");
        invoiceMsg.id = "invoice-limit-msg";
        invoiceMsg.style.color = "#e67e22";
        invoiceMsg.style.fontSize = "0.95em";
        invoiceMsg.style.marginTop = "0.3em";
        invoiceMsg.textContent =
          "Invoice payment is not available for orders above 800 SEK.";
        // Insert after the invoice radio label
        const invoiceLabel = invoiceRadio.closest("label");
        if (invoiceLabel?.parentElement) {
          invoiceLabel.parentElement.appendChild(invoiceMsg);
        }
      }
    } else {
      invoiceRadio.disabled = false;
      if (invoiceMsg) invoiceMsg.remove();
    }
  }

  // Get card input fields
  const cardNumberInput = document.getElementById("cardNumber");
  const cardExpiryInput = document.getElementById("cardExpiry");
  const cardCVCInput = document.getElementById("cardCVC");

  const payment = Array.from(paymentRadios).find((r) => r.checked)?.value;

  if (payment === "invoice") {
    invoiceFields.style.display = "block";
    cardFields.style.display = "none";
    ssnInput.required = true; // SSN is required for invoice
    // Card fields not required
    if (cardNumberInput) cardNumberInput.required = false;
    if (cardExpiryInput) cardExpiryInput.required = false;
    if (cardCVCInput) cardCVCInput.required = false;
  } else {
    invoiceFields.style.display = "none";
    cardFields.style.display = "block";
    ssnInput.required = false;
    // Card fields required
    if (cardNumberInput) cardNumberInput.required = true;
    if (cardExpiryInput) cardExpiryInput.required = true;
    if (cardCVCInput) cardCVCInput.required = true;
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
    "cardNumber",
    "cardExpiry",
    "cardCVC",
  ];

  const form = document.getElementById("checkout-form");
  const submitBtn = document.getElementById("submit-btn");

  inputs.forEach((id) => {
    const input = document.getElementById(id);
    const errorSpan = document.getElementById(`error-${id}`);

    if (input && errorSpan) {
      if (!input.checkValidity()) {
        // 1. Mark field as invalid for screen readers
        input.setAttribute("aria-invalid", "true");

        // 2. Logic for different error types
        if (input.validity.valueMissing) {
          errorSpan.textContent = "This field is required.";
        } else if (input.validity.typeMismatch) {
          errorSpan.textContent =
            "Please enter a valid email address (e.g., name@example.com).";
        } else if (input.validity.patternMismatch) {
          // Uses the 'title' attribute from your HTML as the message
          errorSpan.textContent = input.title || "Invalid format.";
        }
      } else {
        // 3. Clear message and reset aria-invalid if valid
        input.setAttribute("aria-invalid", "false");
        errorSpan.textContent = "";
      }
    }
  });

  // --- BUTTON ACTIVATION LOGIC ---
  // This part checks if the whole form is valid and enables/disables the button
  if (submitBtn && form) {
    submitBtn.disabled = !form.checkValidity();
  }
}

if (_submitBtn) {
  _submitBtn.disabled = !form.checkValidity();
}

// --- TIMER FUNCTIONS ---
function startCheckoutTimer() {
  // Clear any existing timer
  if (checkoutTimer) {
    clearTimeout(checkoutTimer);
  }

  // Start 15-minute timer
  checkoutTimer = setTimeout(() => {
    // Clear the form
    const form = document.getElementById("checkout-form");
    if (form) {
      form.reset();
    }

    // Clear all error messages
    document.querySelectorAll(".error-message").forEach((el) => {
      el.textContent = "";
    });

    // Show alert to user
    alert(
      "Your checkout session has expired. You took too long to complete the order. Please start over.",
    );

    // Clear the cart
    localStorage.removeItem("cart");

    // Notify other components that cart was cleared
    window.dispatchEvent(new CustomEvent("cart:cleared"));

    // Close checkout overlay
    const overlay = document.getElementById("checkout-overlay");
    if (overlay) {
      overlay.style.display = "none";
    }

    // Re-render the (now empty) cart
    renderCheckoutCart();
  }, CHECKOUT_TIMEOUT);

  console.log("Checkout timer started: 15 minutes until timeout");
}

function stopCheckoutTimer() {
  if (checkoutTimer) {
    clearTimeout(checkoutTimer);
    checkoutTimer = null;
    console.log("Checkout timer stopped");
  }
}

// Export timer function so it can be called from main.js
export { stopCheckoutTimer };

// Reset timer on user interaction (optional - extends time on activity)
function resetCheckoutTimer() {
  if (checkoutTimer) {
    console.log("Checkout timer reset due to user activity");
    startCheckoutTimer(); // Restart the timer
  }
}

// --- 3. INITIALIZATION ---
export function initCheckoutOverlay() {
  // 1. Identify key elements
  form = document.getElementById("checkout-form");
  _submitBtn = document.getElementById("submit-btn");
  resetBtn = document.getElementById("reset-btn");
  paymentRadios = document.getElementsByName("payment");
  cardFields = document.getElementById("card-fields");
  invoiceFields = document.getElementById("invoice-fields");
  ssnInput = document.getElementById("ssn");
  const discountInput = document.getElementById("discount");

  // 2. Initial renders and Timer
  renderCheckoutCart();
  startCheckoutTimer();

  // --- DISCOUNT CODE INPUT HANDLER ---
  if (discountInput) {
    // Add visual feedback container
    let discountFeedback = document.getElementById("discount-feedback");
    if (!discountFeedback) {
      discountFeedback = document.createElement("div");
      discountFeedback.id = "discount-feedback";
      discountFeedback.style.marginTop = "0.5rem";
      discountFeedback.style.fontSize = "0.9rem";
      discountFeedback.style.fontWeight = "bold";
      discountInput.parentElement.appendChild(discountFeedback);
    }

    discountInput.addEventListener("input", (e) => {
      const code = e.target.value.trim().toUpperCase();

      if (code === "") {
        appliedDiscountCode = null;
        discountFeedback.textContent = "";
        discountFeedback.style.color = "";
        renderCheckoutCart();
        updatePaymentFields();
        return;
      }

      const discountRate = applyDiscountCode(code);

      if (discountRate !== null) {
        const percentage = Math.round(discountRate * 100);
        discountFeedback.textContent = `✓ Code applied! You get ${percentage}% off`;
        discountFeedback.style.color = "#1abc9c";
        renderCheckoutCart();
        updatePaymentFields();
      } else {
        appliedDiscountCode = null;
        discountFeedback.textContent = "✗ Invalid discount code";
        discountFeedback.style.color = "#e74c3c";
        renderCheckoutCart();
        updatePaymentFields();
      }
    });
  }

  // --- 3. FOCUS TRAP LOGIC (A11y) ---
  const overlay = document.getElementById("checkout-overlay");
  const firstFocusable = document.getElementById("firstName"); // First input field
  const lastFocusable = document.getElementById("close-checkout"); // Last button in modal

  // Automatically move focus to the first field when opening for better UX
  setTimeout(() => firstFocusable?.focus(), 100);

  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      if (e.shiftKey) {
        // If Shift + Tab (Backward)
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus(); // Loop to the end
        }
      } else {
        // If Tab (Forward)
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus(); // Loop to the start
        }
      }
    }

    // Close modal if user presses Escape key
    if (e.key === "Escape") {
      const closeBtn = document.getElementById("close-checkout");
      closeBtn?.click();
    }
  });
  // --- END FOCUS TRAP ---

  // 4. Event Listeners

  // Update error messages and button state in real-time
  form.addEventListener("input", updateErrorMessages);

  // Payment method toggle
  for (const radio of paymentRadios) {
    radio.addEventListener("change", updatePaymentFields);
  }

  // Handle storage changes (e.g., cart updated in another tab)
  window.addEventListener("storage", (e) => {
    if (e.key === "cart") {
      updatePaymentFields();
      renderCheckoutCart();
    }
  });

  // Handle form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      updateErrorMessages();
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    stopCheckoutTimer();

    // Show discount in confirmation message if applied
    let confirmationMessage =
      "Thank you for your order! Your sushi is on its way.";
    if (appliedDiscountCode && discountCodeAmount > 0) {
      confirmationMessage += ` You saved ${discountCodeAmount} SEK with code ${appliedDiscountCode}!`;
    }

    alert(confirmationMessage);
    localStorage.removeItem("cart");
    window.dispatchEvent(new CustomEvent("cart:cleared"));
    document.getElementById("checkout-overlay").style.display = "none";

    // Reset discount code
    appliedDiscountCode = null;
    discountCodeAmount = 0;
  });

  // Clear Order Button
  resetBtn.addEventListener("click", () => {
    // Timeout 0 to let the native form reset finish first
    setTimeout(() => {
      localStorage.removeItem("cart");
      appliedDiscountCode = null;
      discountCodeAmount = 0;

      // Clear discount feedback
      const discountFeedback = document.getElementById("discount-feedback");
      if (discountFeedback) {
        discountFeedback.textContent = "";
      }

      renderCheckoutCart();
      window.dispatchEvent(new CustomEvent("cart:cleared"));

      // Clear all visual error texts
      document
        .querySelectorAll(".error-message")
        .forEach((el) => (el.textContent = ""));
      updateErrorMessages();
    }, 0);
  });

  // 5. Final Initialization
  updatePaymentFields();
  updateErrorMessages();
}
