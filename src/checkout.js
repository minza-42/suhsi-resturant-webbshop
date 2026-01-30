/* src/checkout.js */
/* jshint esversion: 11 */

import {
  applyDiscountCode,
  removeDiscountCode,
  getAppliedDiscountCode,
  calculateCartTotal,
  isWeekendSurcharge,
} from "./discounts.js";

// ============================================================================
// CONSTANTS
// ============================================================================

const CHECKOUT_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const INVOICE_LIMIT = 800; // SEK

// ============================================================================
// STATE
// ============================================================================

let checkoutTimer = null;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safely get cart from localStorage
 */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch (e) {
    console.error("Failed to load cart:", e);
    return [];
  }
}

/**
 * Safely clear cart from localStorage
 */
function clearCart() {
  try {
    localStorage.removeItem("cart");
  } catch (e) {
    console.error("Failed to clear cart:", e);
  }
}

// ============================================================================
// CART RENDERING
// ============================================================================

/**
 * Render checkout cart with all discounts
 */
export function renderCheckoutCart() {
  const cart = getCart();
  const container = document.getElementById("checkout-cart-items");
  const submitBtn = document.getElementById("submit-btn");

  if (!container) return;

  // Handle empty cart
  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  // Use centralized calculation from discounts.js
  const totals = calculateCartTotal(cart);
  const isWeekend = isWeekendSurcharge();

  // Render cart items
  const cartHtml = cart
    .map((item) => {
      const itemQuantity = item.quantity || 1;
      const itemPrice = isWeekend ? Math.round(item.price * 1.15) : item.price;
      const itemTotal = itemPrice * itemQuantity;

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

  // Build discount rows HTML
  let discountRows = "";

  // Bulk discounts
  Object.entries(totals.bulkDiscounts).forEach(([productName, amount]) => {
    if (amount > 0) {
      discountRows += `<div class="checkout-discount-row" style="color:#1abc9c;font-weight:bold;margin-top:0.5rem;text-align:right;">10% bulk discount on ${productName}: -${amount} SEK</div>`;
    }
  });

  // Monday discount
  if (totals.mondayDiscount > 0) {
    discountRows += `<div class="checkout-discount-row" style="color:#1abc9c;font-weight:bold;margin-top:0.5rem;text-align:right;">Monday morning discount: -${totals.mondayDiscount} SEK</div>`;
  }

  // Shipping
  if (totals.shippingCost > 0) {
    discountRows += `<div style="text-align:right; margin-top:0.5rem; color:#555;">Shipping: ${totals.shippingCost} SEK</div>`;
  } else {
    discountRows += `<div style="text-align:right; margin-top:0.5rem; color:#1abc9c;font-weight:bold;">Free shipping!</div>`;
  }

  // Discount code
  if (totals.discountCodeAmount > 0 && totals.discountCode) {
    discountRows += `<div class="checkout-discount-row" style="color:#1abc9c;font-weight:bold;margin-top:0.5rem;text-align:right;">Discount code ${totals.discountCode}: -${totals.discountCodeAmount} SEK</div>`;
  }

  // Inject HTML
  container.innerHTML =
    cartHtml +
    discountRows +
    `<div style="text-align:right; font-weight:bold; margin-top:0.5rem; font-size:1.1rem;">
      Total: ${totals.finalTotal} SEK
    </div>`;
}

// ============================================================================
// FORM VALIDATION
// ============================================================================

/**
 * Update payment fields based on selection and cart total
 */
function updatePaymentFields() {
  const paymentRadios = document.getElementsByName("payment");
  const cardFields = document.getElementById("card-fields");
  const invoiceFields = document.getElementById("invoice-fields");
  const ssnInput = document.getElementById("ssn");

  if (!paymentRadios || !cardFields || !invoiceFields || !ssnInput) return;

  // Get cart total using centralized calculation
  const cart = getCart();
  const totals = calculateCartTotal(cart);
  const total = totals.finalTotal;

  // Handle invoice limit
  const invoiceRadio = Array.from(paymentRadios).find(
    (r) => r.value === "invoice",
  );
  let invoiceMsg = document.getElementById("invoice-limit-msg");

  if (invoiceRadio) {
    if (total > INVOICE_LIMIT) {
      invoiceRadio.disabled = true;

      // If invoice was selected, switch to card
      if (invoiceRadio.checked) {
        const cardRadio = Array.from(paymentRadios).find(
          (r) => r.value === "card",
        );
        if (cardRadio) cardRadio.checked = true;
      }

      // Show message
      if (!invoiceMsg) {
        invoiceMsg = document.createElement("div");
        invoiceMsg.id = "invoice-limit-msg";
        invoiceMsg.style.color = "#e67e22";
        invoiceMsg.style.fontWeight = "bold";
        invoiceMsg.style.fontSize = "0.95em";
        invoiceMsg.style.marginTop = "0.3em";
        invoiceMsg.textContent = `Invoice payment is not available for orders above ${INVOICE_LIMIT} SEK.`;

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

  // Toggle field visibility and requirements
  if (payment === "invoice") {
    invoiceFields.style.display = "block";
    cardFields.style.display = "none";
    ssnInput.required = true;

    if (cardNumberInput) cardNumberInput.required = false;
    if (cardExpiryInput) cardExpiryInput.required = false;
    if (cardCVCInput) cardCVCInput.required = false;
  } else {
    invoiceFields.style.display = "none";
    cardFields.style.display = "block";
    ssnInput.required = false;

    if (cardNumberInput) cardNumberInput.required = true;
    if (cardExpiryInput) cardExpiryInput.required = true;
    if (cardCVCInput) cardCVCInput.required = true;
  }
}

/**
 * Update error messages for all form fields
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
        input.setAttribute("aria-invalid", "true");

        if (input.validity.valueMissing) {
          errorSpan.textContent = "This field is required.";
        } else if (input.validity.typeMismatch) {
          errorSpan.textContent =
            "Please enter a valid email address (e.g., name@example.com).";
        } else if (input.validity.patternMismatch) {
          errorSpan.textContent = input.title || "Invalid format.";
        }
      } else {
        input.setAttribute("aria-invalid", "false");
        errorSpan.textContent = "";
      }
    }
  });

  // Update submit button state
  if (submitBtn && form) {
    submitBtn.disabled = !form.checkValidity();
  }
}

// ============================================================================
// TIMER FUNCTIONS
// ============================================================================

/**
 * Start 15-minute checkout timer
 */
function startCheckoutTimer() {
  if (checkoutTimer) {
    clearTimeout(checkoutTimer);
  }

  checkoutTimer = setTimeout(() => {
    const form = document.getElementById("checkout-form");
    if (form) form.reset();

    document.querySelectorAll(".error-message").forEach((el) => {
      el.textContent = "";
    });

    alert(
      "Your checkout session has expired. You took too long to complete the order. Please start over.",
    );

    clearCart();
    removeDiscountCode();
    window.dispatchEvent(new CustomEvent("cart:cleared"));

    const overlay = document.getElementById("checkout-overlay");
    if (overlay) overlay.style.display = "none";

    renderCheckoutCart();
  }, CHECKOUT_TIMEOUT);

  console.log("Checkout timer started: 15 minutes until timeout");
}

/**
 * Stop checkout timer
 */
export function stopCheckoutTimer() {
  if (checkoutTimer) {
    clearTimeout(checkoutTimer);
    checkoutTimer = null;
    console.log("Checkout timer stopped");
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize checkout overlay
 */
export function initCheckoutOverlay() {
  // Get form elements
  const form = document.getElementById("checkout-form");
  const submitBtn = document.getElementById("submit-btn");
  const resetBtn = document.getElementById("reset-btn");
  const paymentRadios = document.getElementsByName("payment");
  const discountInput = document.getElementById("discount");

  if (!form) {
    console.error("Checkout form not found");
    return;
  }

  // Initial render and start timer
  renderCheckoutCart();
  startCheckoutTimer();

  // ============================================================================
  // DISCOUNT CODE HANDLER
  // ============================================================================

  if (discountInput) {
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
      const code = e.target.value.trim();

      if (code === "") {
        removeDiscountCode();
        discountFeedback.textContent = "";
        discountFeedback.style.color = "";
        renderCheckoutCart();
        updatePaymentFields();
        return;
      }

      const result = applyDiscountCode(code);

      if (result.success) {
        discountFeedback.textContent = result.message;
        discountFeedback.style.color = "#1abc9c";
      } else {
        discountFeedback.textContent = result.message;
        discountFeedback.style.color = "#e74c3c";
      }

      renderCheckoutCart();
      updatePaymentFields();
    });
  }

  // ============================================================================
  // FOCUS TRAP (Accessibility)
  // ============================================================================

  const overlay = document.getElementById("checkout-overlay");
  const firstFocusable = document.getElementById("firstName");
  const lastFocusable = document.getElementById("close-checkout");

  setTimeout(() => firstFocusable?.focus(), 100);

  if (overlay) {
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      }

      if (e.key === "Escape") {
        const closeBtn = document.getElementById("close-checkout");
        closeBtn?.click();
      }
    });
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  // Real-time validation
  form.addEventListener("input", updateErrorMessages);

  // Payment method toggle
  for (const radio of paymentRadios) {
    radio.addEventListener("change", updatePaymentFields);
  }

  // Handle storage changes (cart updated in another tab)
  window.addEventListener("storage", (e) => {
    if (e.key === "cart" || e.key === "discountCode") {
      updatePaymentFields();
      renderCheckoutCart();
    }
  });

  // Form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      updateErrorMessages();
      return;
    }

    const cart = getCart();
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    stopCheckoutTimer();

    // Get final totals for confirmation
    const totals = calculateCartTotal(cart);
    const discountCode = getAppliedDiscountCode();

    let confirmationMessage =
      "Thank you for your order! Your sushi is on its way.";
    if (discountCode && totals.discountCodeAmount > 0) {
      confirmationMessage += ` You saved ${totals.discountCodeAmount} SEK with code ${discountCode}!`;
    }

    alert(confirmationMessage);

    clearCart();
    removeDiscountCode();
    window.dispatchEvent(new CustomEvent("cart:cleared"));

    const checkoutOverlay = document.getElementById("checkout-overlay");
    if (checkoutOverlay) checkoutOverlay.style.display = "none";
  });

  // Reset button
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      setTimeout(() => {
        clearCart();
        removeDiscountCode();

        const discountFeedback = document.getElementById("discount-feedback");
        if (discountFeedback) {
          discountFeedback.textContent = "";
        }

        renderCheckoutCart();
        window.dispatchEvent(new CustomEvent("cart:cleared"));

        document
          .querySelectorAll(".error-message")
          .forEach((el) => (el.textContent = ""));

        updateErrorMessages();
      }, 0);
    });
  }

  // Initial setup
  updatePaymentFields();
  updateErrorMessages();
}
