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
  let bulkDiscounts = {};
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
      <span>${itemTotal} kr</span>
    </div>`;
    })
    .join("");

  // --- Monday Discount Logic ---
  let discount = 0;
  let discountedTotal = total;
  if (now.getDay() === 1 && now.getHours() < 10) {
    discount = Math.round(total * 0.1);
    discountedTotal = total - discount;
  }

  // No separate surcharge row, just use the new total
  let finalTotal = discountedTotal; // discountedTotal is based on the new total above

  // 5. Render discount rows for bulk discount
  let bulkDiscountRows = "";
  Object.entries(bulkDiscounts).forEach(([cat, amount]) => {
    if (amount > 0) {
      bulkDiscountRows += `<div class=\"checkout-discount-row\" style=\"color:#1abc9c;font-weight:bold;margin-top:0.5rem;text-align:right;\">10% bulk discount on ${cat}: -${amount} kr</div>`;
    }
  });

  // Inject items and final total
  container.innerHTML =
    cartHtml +
    bulkDiscountRows +
    (discount > 0
      ? `<div id=\"checkout-discount-row\" style=\"color:#1abc9c;font-weight:bold;margin-top:1rem;text-align:right;\">Monday morning discount: -${discount} kr</div>`
      : "") +
    `<div style=\"text-align:right; font-weight:bold; margin-top:0.5rem; font-size:1.1rem;\">
      Total: ${finalTotal} kr
    </div>`;
}

// --- 2. FORM & VALIDATION LOGIC ---
let form,
  submitBtn,
  resetBtn,
  paymentRadios,
  cardFields,
  invoiceFields,
  ssnInput,
  gdprCheckbox;

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
          "Invoice payment is not available for orders above 800 kr.";
        // Insert after the invoice radio label
        const invoiceLabel = invoiceRadio.closest("label");
        if (invoiceLabel && invoiceLabel.parentElement) {
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
export function initCheckoutOverlay() {
  form = document.getElementById("checkout-form");
  submitBtn = document.getElementById("submit-btn");
  resetBtn = document.getElementById("reset-btn");
  paymentRadios = document.getElementsByName("payment");
  cardFields = document.getElementById("card-fields");
  invoiceFields = document.getElementById("invoice-fields");
  ssnInput = document.getElementById("ssn");
  gdprCheckbox = document.getElementById("gdpr");

  renderCheckoutCart();
  updatePaymentFields();

  // Listen for cart clear event from main overlay
  window.addEventListener("cart:cleared", () => {
    renderCheckoutCart();
    updatePaymentFields();
  });

  // Payment method toggle
  paymentRadios.forEach((radio) => {
    radio.addEventListener("change", updatePaymentFields);
  });

  // Re-evaluate payment fields after cart is rendered (e.g. after quantity change)
  // Listen for storage changes (if cart is updated in another tab)
  window.addEventListener("storage", (e) => {
    if (e.key === "cart") {
      updatePaymentFields();
    }
  });

  // Also update payment fields after rendering cart (in case total changed)
  setTimeout(updatePaymentFields, 100);

  // Update error messages in real-time as user types
  form.addEventListener("input", updateErrorMessages);

  // Handle form submission
  form.addEventListener("submit", (e) => {
    if (!form.checkValidity()) {
      e.preventDefault();
      updateErrorMessages();
      return;
    }
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (cart.length === 0) {
      e.preventDefault();
      alert("Your cart is empty. Please add products before checking out.");
      return;
    }
    e.preventDefault();
    alert("Thank you for your order! Your sushi is on its way.");
    localStorage.removeItem("cart");
    renderCheckoutCart();
    // Optionally close overlay here
    document.getElementById("checkout-overlay").style.display = "none";
  });

  // Clear Order Button
  resetBtn.addEventListener("click", () => {
    setTimeout(() => {
      localStorage.removeItem("cart");
      renderCheckoutCart();
      // Notify main cart UI to update
      window.dispatchEvent(new CustomEvent("cart:cleared"));
      document
        .querySelectorAll(".error-message")
        .forEach((el) => (el.textContent = ""));
    }, 0);
  });
}
