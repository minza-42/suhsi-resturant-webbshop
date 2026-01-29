/* src/discounts.js */
/* jshint esversion: 8 */

// --- DISCOUNT CODES ---
export const DISCOUNT_CODES = {
  SUSHI10: 0.1,
  SUSHI20: 0.2,
};

// --- DISCOUNT STATE ---
let appliedDiscountCode = localStorage.getItem("discountCode") || null;

// Get current discount code
export function getAppliedDiscountCode() {
  return appliedDiscountCode;
}

// Apply discount code
export function applyDiscountCode(code) {
  if (!code) {
    appliedDiscountCode = null;
    localStorage.removeItem("discountCode");
    return { success: false, message: "Please enter a discount code" };
  }

  const upperCode = code.trim().toUpperCase();

  if (DISCOUNT_CODES[upperCode]) {
    appliedDiscountCode = upperCode;
    localStorage.setItem("discountCode", upperCode);
    return {
      success: true,
      message: `✓ Code ${upperCode} applied! You get ${DISCOUNT_CODES[upperCode] * 100}% off`,
      discount: DISCOUNT_CODES[upperCode],
    };
  } else {
    appliedDiscountCode = null;
    localStorage.removeItem("discountCode");
    return { success: false, message: "✗ Invalid discount code" };
  }
}

// Remove discount code
export function removeDiscountCode() {
  appliedDiscountCode = null;
  localStorage.removeItem("discountCode");
}

// Calculate discount code amount
export function calculateDiscountCodeAmount(subtotal) {
  if (!appliedDiscountCode || !DISCOUNT_CODES[appliedDiscountCode]) {
    return 0;
  }
  return Math.round(subtotal * DISCOUNT_CODES[appliedDiscountCode]);
}

// --- BULK DISCOUNT LOGIC (PER PRODUCT) ---
export function calculateBulkDiscounts(cart, isWeekend) {
  const bulkDiscounts = {};
  let total = 0;

  cart.forEach((item) => {
    const itemQuantity = item.quantity || 1;
    const itemPrice = isWeekend ? Math.round(item.price * 1.15) : item.price;
    let itemTotal = itemPrice * itemQuantity;

    // Apply 10% discount if this specific product has 10+ quantity
    if (itemQuantity >= 10) {
      const discount = Math.round(itemTotal * 0.1);
      // Group by product name
      const productKey = item.name || item.id;
      bulkDiscounts[productKey] = (bulkDiscounts[productKey] || 0) + discount;
      itemTotal -= discount;
    }
    total += itemTotal;
  });

  return { total, bulkDiscounts };
}

// --- MONDAY DISCOUNT LOGIC ---
export function calculateMondayDiscount(total) {
  const now = new Date();
  if (now.getDay() === 1 && now.getHours() < 10) {
    return Math.round(total * 0.1);
  }
  return 0;
}

// --- SHIPPING COST LOGIC ---
export function calculateShippingCost(cart, subtotal) {
  // Calculate total number of items
  let totalItems = 0;
  cart.forEach((item) => {
    totalItems += item.quantity || 1;
  });

  // Free shipping over 15 items
  if (totalItems >= 15) {
    return 0;
  }

  return 25 + Math.round(subtotal * 0.1);
}

// --- WEEKEND SURCHARGE CHECK ---
export function isWeekendSurcharge() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  // Weekend logic: Friday 15:00 to Monday 03:00
  return (
    (day === 5 && hour >= 15) || // Friday after 15:00
    day === 6 || // Saturday
    day === 0 || // Sunday
    (day === 1 && hour < 3) // Monday before 03:00
  );
}

// --- BUILD DISCOUNT INFO HTML ---
export function buildDiscountInfoHTML(discounts) {
  const {
    mondayDiscount,
    bulkDiscounts,
    discountCodeAmount,
    discountCode,
    shippingCost,
  } = discounts;

  let html = "";

  // Monday discount
  if (mondayDiscount > 0) {
    html += `
      <div class="cart-discount-row">
        <span class="discount-label">Monday Discount (10%)</span>
        <span class="discount-value">-${mondayDiscount} SEK</span>
      </div>`;
  }

  // Bulk discounts (per product)
  Object.entries(bulkDiscounts).forEach(([productName, amount]) => {
    if (amount > 0) {
      html += `
        <div class="cart-bulk-discount-row">
          <span class="discount-label">Bulk Discount on ${productName}</span>
          <span class="discount-value">-${amount} SEK</span>
        </div>`;
    }
  });

  // Discount Code
  if (discountCodeAmount > 0 && discountCode) {
    const percentage = DISCOUNT_CODES[discountCode] * 100;
    html += `
      <div class="cart-discount-row">
        <span class="discount-label">Code ${discountCode} (${percentage}%)</span>
        <span class="discount-value">-${discountCodeAmount} SEK</span>
      </div>`;
  }

  // Shipping
  if (shippingCost > 0) {
    html += `
      <div class="cart-shipping-row">
        <span class="shipping-label">Shipping</span>
        <span class="shipping-value">+${shippingCost} SEK</span>
      </div>`;
  } else {
    html += `
      <div class="cart-shipping-row free">
        <span class="free-shipping-label">Free Shipping</span>
        <span class="shipping-value">0 SEK</span>
      </div>`;
  }

  return html;
}

// --- CALCULATE ALL DISCOUNTS AND TOTAL ---
export function calculateCartTotal(cart) {
  if (cart.length === 0) {
    return {
      subtotal: 0,
      mondayDiscount: 0,
      bulkDiscounts: {},
      shippingCost: 0,
      discountCodeAmount: 0,
      finalTotal: 0,
    };
  }

  const isWeekend = isWeekendSurcharge();

  // Calculate bulk discounts and subtotal
  const { total, bulkDiscounts } = calculateBulkDiscounts(cart, isWeekend);

  // Calculate Monday discount
  const mondayDiscount = calculateMondayDiscount(total);
  const discountedTotal = total - mondayDiscount;

  // Calculate shipping
  const shippingCost = calculateShippingCost(cart, discountedTotal);

  // Calculate discount code
  const discountCodeAmount = calculateDiscountCodeAmount(
    discountedTotal + shippingCost,
  );

  // Calculate final total
  const finalTotal = discountedTotal + shippingCost - discountCodeAmount;

  return {
    subtotal: total,
    mondayDiscount,
    bulkDiscounts,
    shippingCost,
    discountCodeAmount,
    discountCode: appliedDiscountCode,
    finalTotal,
  };
}
