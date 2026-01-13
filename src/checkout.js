// checkout.js - Handles checkout form logic, validation, and payment field toggling

document.addEventListener("DOMContentLoaded", function () {
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
    // Luhn check (mod 10)
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
    }, 0);
    // TODO: Reset cart if needed (if cart is stored in localStorage, clear it here)
  });
});
