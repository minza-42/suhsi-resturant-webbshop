// --- CSS IMPORTS ---
import "../css/base.css";
import "../css/layout.css";
import "../css/components.css";
import "../css/forms.css";
import "../css/checkout.css";
import "../css/main.css";

// --- All checkout logic in one DOMContentLoaded ---
document.addEventListener("DOMContentLoaded", function () {
  // --- Theme toggle logic ---
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    let theme =
      localStorage.getItem("theme") || (prefersDark ? "dark" : "light");
    setTheme(theme);
    themeToggle.innerHTML =
      theme === "dark"
        ? '<img src="img/light_mode.svg" alt="Light mode" width="24" height="24" style="vertical-align:middle;">'
        : '<img src="img/dark_mode.svg" alt="Dark mode" width="24" height="24" style="vertical-align:middle;">';
    themeToggle.addEventListener("click", () => {
      theme = document.documentElement.classList.contains("dark-mode")
        ? "light"
        : "dark";
      setTheme(theme);
      localStorage.setItem("theme", theme);
      themeToggle.innerHTML =
        theme === "dark"
          ? '<img src="img/light_mode.svg" alt="Light mode" width="24" height="24" style="vertical-align:middle;">'
          : '<img src="img/dark_mode.svg" alt="Dark mode" width="24" height="24" style="vertical-align:middle;">';
    });
  }
  function setTheme(theme) {
    if (theme === "dark") {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
  }

  // --- Cart rendering logic ---
  function renderCheckoutCart() {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const container = document.getElementById("checkout-cart-items");
    if (!container) return;
    if (!cart.length) {
      container.innerHTML = "<p>Your cart is empty.</p>";
      return;
    }
    let total = 0;
    container.innerHTML =
      cart
        .map((item) => {
          total += item.price;
          return `<div class='cart-item' style='display:flex;align-items:center;gap:1rem;margin-bottom:1rem;'>
        <img src='${item.image}' alt='${item.name}' class='cart-item-img' width='48' height='48' loading='lazy' style='border-radius:8px;object-fit:cover;background:#f3f3f3;'>
        <div style='flex:1;'>
          <strong>${item.name}</strong><br>
          <span style='font-size:0.95em;color:var(--text-main);'>${item.category}</span>
        </div>
        <span>${item.price} kr</span>
      </div>`;
        })
        .join("") +
      `<div style='text-align:right;font-weight:bold;margin-top:1rem;'>Total: ${total} kr</div>`;
  }
  window.renderCheckoutCart = renderCheckoutCart;
  renderCheckoutCart();

  // --- Checkout form logic ---
  const form = document.getElementById("checkout-form");
  const submitBtn = document.getElementById("submit-btn");
  const resetBtn = document.getElementById("reset-btn");
  const paymentRadios = document.getElementsByName("payment");
  const cardFields = document.getElementById("card-fields");
  const invoiceFields = document.getElementById("invoice-fields");
  const ssnInput = document.getElementById("ssn");
  const gdprCheckbox = document.getElementById("gdpr");

  // Helper: Show error
  function showError(id, message) {
    const el = document.getElementById("error-" + id);
    if (el) {
      el.textContent = message;
      el.style.display = message ? "block" : "none";
    }
    const input = document.getElementById(id);
    if (input) {
      input.setAttribute("aria-invalid", message ? "true" : "false");
      input.style.borderColor = message ? "#c00" : "";
    }
  }

  // Helper: Validate Swedish SSN
  function validateSwedishSSN(ssn) {
    // Accepts 12 or 10 digits, with or without dash
    const cleaned = ssn.replace(/[^0-9]/g, "");
    if (!/^\d{10,12}$/.test(cleaned)) return false;
    let sum = 0,
      alt = false;
    for (let i = cleaned.length - 2; i >= 0; i--) {
      let n = parseInt(cleaned[i], 10);
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === parseInt(cleaned[cleaned.length - 1], 10);
  }

  // Payment method toggle
  function updatePaymentFields() {
    const payment = Array.from(paymentRadios).find((r) => r.checked)?.value;
    if (payment === "invoice") {
      invoiceFields.style.display = "block";
      cardFields.style.display = "none";
      ssnInput.setAttribute("required", "required");
    } else {
      invoiceFields.style.display = "none";
      cardFields.style.display = "block";
      ssnInput.removeAttribute("required");
      showError("ssn", "");
    }
  }
  paymentRadios.forEach((r) =>
    r.addEventListener("change", updatePaymentFields)
  );
  updatePaymentFields();

  // Validation
  function validateForm() {
    let valid = true;
    // Required text fields
    [
      "firstName",
      "lastName",
      "address",
      "zip",
      "city",
      "phone",
      "email",
    ].forEach((id) => {
      const input = document.getElementById(id);
      if (!input.value.trim()) {
        showError(id, "Required field");
        valid = false;
      } else {
        showError(id, "");
      }
    });
    // Zip
    const zip = document.getElementById("zip").value.trim();
    if (zip && !/^\d{5}$/.test(zip)) {
      showError("zip", "Enter five digits");
      valid = false;
    }
    // Phone
    const phone = document.getElementById("phone").value.trim();
    if (phone && !/^\+?\d{7,15}$/.test(phone)) {
      showError("phone", "Enter a valid mobile number");
      valid = false;
    }
    // Email
    const email = document.getElementById("email").value.trim();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      showError("email", "Enter a valid email address");
      valid = false;
    }
    // GDPR
    if (!gdprCheckbox.checked) {
      showError("gdpr", "You must agree to the processing of personal data");
      valid = false;
    } else {
      showError("gdpr", "");
    }
    // Payment
    const payment = Array.from(paymentRadios).find((r) => r.checked)?.value;
    if (payment === "invoice") {
      const ssn = ssnInput.value.trim();
      if (!ssn) {
        showError("ssn", "Required field");
        valid = false;
      } else if (!validateSwedishSSN(ssn)) {
        showError("ssn", "Invalid personal identity number");
        valid = false;
      } else {
        showError("ssn", "");
      }
    }
    // Enable/disable submit
    submitBtn.disabled = !valid;
    return valid;
  }

  form.addEventListener("input", validateForm);
  form.addEventListener("change", validateForm);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (validateForm()) {
      alert("Thank you for your order!");
      form.reset();
      updatePaymentFields();
      validateForm();
      // Clear cart from localStorage
      localStorage.removeItem("cart");
      // Also update cart display if present
      if (typeof window.renderCheckoutCart === "function")
        window.renderCheckoutCart();
    }
  });
  resetBtn.addEventListener("click", function () {
    setTimeout(() => {
      // Reset errors and payment fields
      document
        .querySelectorAll(".error-message")
        .forEach((e) => (e.textContent = ""));
      updatePaymentFields();
      validateForm();
      // Clear cart from localStorage
      localStorage.removeItem("cart");
      if (typeof window.renderCheckoutCart === "function")
        window.renderCheckoutCart();
    }, 0);
  });
});
const form = document.getElementById("checkout-form");
const submitBtn = document.getElementById("submit-btn");
const resetBtn = document.getElementById("reset-btn");
const paymentRadios = document.getElementsByName("payment");
const cardFields = document.getElementById("card-fields");
const invoiceFields = document.getElementById("invoice-fields");
const ssnInput = document.getElementById("ssn");
const gdprCheckbox = document.getElementById("gdpr");

// Helper: Show error
function showError(id, message) {
  const el = document.getElementById("error-" + id);
  if (el) {
    el.textContent = message;
    el.style.display = message ? "block" : "none";
  }
  const input = document.getElementById(id);
  if (input) {
    input.setAttribute("aria-invalid", message ? "true" : "false");
    input.style.borderColor = message ? "#c00" : "";
  }
}

// Helper: Validate Swedish SSN
function validateSwedishSSN(ssn) {
  // Accepts 12 or 10 digits, with or without dash
  const cleaned = ssn.replace(/[^0-9]/g, "");
  if (!/^\d{10,12}$/.test(cleaned)) return false;
  let sum = 0,
    alt = false;
  for (let i = cleaned.length - 2; i >= 0; i--) {
    let n = parseInt(cleaned[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === parseInt(cleaned[cleaned.length - 1], 10);
}

// Payment method toggle
function updatePaymentFields() {
  const payment = Array.from(paymentRadios).find((r) => r.checked)?.value;
  if (payment === "invoice") {
    invoiceFields.style.display = "block";
    cardFields.style.display = "none";
    ssnInput.setAttribute("required", "required");
  } else {
    invoiceFields.style.display = "none";
    cardFields.style.display = "block";
    ssnInput.removeAttribute("required");
    showError("ssn", "");
  }
}
paymentRadios.forEach((r) => r.addEventListener("change", updatePaymentFields));
updatePaymentFields();

// Validation
function validateForm() {
  let valid = true;
  // Required text fields
  ["firstName", "lastName", "address", "zip", "city", "phone", "email"].forEach(
    (id) => {
      const input = document.getElementById(id);
      if (!input.value.trim()) {
        showError(id, "Required field");
        valid = false;
      } else {
        showError(id, "");
      }
    }
  );
  // Zip
  const zip = document.getElementById("zip").value.trim();
  if (zip && !/^\d{5}$/.test(zip)) {
    showError("zip", "Enter five digits");
    valid = false;
  }
  // Phone
  const phone = document.getElementById("phone").value.trim();
  if (phone && !/^\+?\d{7,15}$/.test(phone)) {
    showError("phone", "Enter a valid mobile number");
    valid = false;
  }
  // Email
  const email = document.getElementById("email").value.trim();
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    showError("email", "Enter a valid email address");
    valid = false;
  }
  // GDPR
  if (!gdprCheckbox.checked) {
    showError("gdpr", "You must agree to the processing of personal data");
    valid = false;
  } else {
    showError("gdpr", "");
  }
  // Payment
  const payment = Array.from(paymentRadios).find((r) => r.checked)?.value;
  if (payment === "invoice") {
    const ssn = ssnInput.value.trim();
    if (!ssn) {
      showError("ssn", "Required field");
      valid = false;
    } else if (!validateSwedishSSN(ssn)) {
      showError("ssn", "Invalid personal identity number");
      valid = false;
    } else {
      showError("ssn", "");
    }
  }
  // Enable/disable submit
  submitBtn.disabled = !valid;
  return valid;
}

form.addEventListener("input", validateForm);
form.addEventListener("change", validateForm);
form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (validateForm()) {
    alert("Thank you for your order!");
    form.reset();
    updatePaymentFields();
    validateForm();
    // Clear cart from localStorage
    localStorage.removeItem("cart");
    // Also update cart display if present
    if (typeof window.renderCheckoutCart === "function")
      window.renderCheckoutCart();
  }
});
resetBtn.addEventListener("click", function () {
  setTimeout(() => {
    // Reset errors and payment fields
    document
      .querySelectorAll(".error-message")
      .forEach((e) => (e.textContent = ""));
    updatePaymentFields();
    validateForm();
    // Clear cart from localStorage
    localStorage.removeItem("cart");
    if (typeof window.renderCheckoutCart === "function")
      window.renderCheckoutCart();
  }, 0);
});
