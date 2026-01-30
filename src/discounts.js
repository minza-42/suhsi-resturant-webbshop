/* src/discounts.js */
/* jshint esversion: 8 */

// ============================================================================
// CONSTANTS
// ============================================================================

const WEEKEND_SURCHARGE = 1.15; // 15% surcharge
const BULK_DISCOUNT_RATE = 0.1; // 10% discount
const MONDAY_DISCOUNT_RATE = 0.1; // 10% discount
const FREE_SHIPPING_THRESHOLD = 15; // items
const BASE_SHIPPING_COST = 25; // SEK
const SHIPPING_PERCENTAGE = 0.1; // 10% of subtotal

// ============================================================================
// DISCOUNT CODES
// ============================================================================

export const DISCOUNT_CODES = {
  SUSHI10: 0.1,
  SUSHI20: 0.2,
};

// ============================================================================
// DISCOUNT STATE (with localStorage persistence)
// ============================================================================

let appliedDiscountCode = null;

// Initialize from localStorage
function initializeDiscountCode() {
  try {
    const saved = localStorage.getItem("discountCode");
    if (saved && DISCOUNT_CODES[saved]) {
      appliedDiscountCode = saved;
    }
  } catch (e) {
    console.error("Failed to load discount code from storage:", e);
  }
}

// Call on module load
initializeDiscountCode();

// ============================================================================
// DISCOUNT CODE FUNCTIONS
// ============================================================================

/**
 * Get current discount code
 */
export function getAppliedDiscountCode() {
  return appliedDiscountCode;
}

/**
 * Apply discount code
 */
export function applyDiscountCode(code) {
  if (!code) {
    appliedDiscountCode = null;
    try {
      localStorage.removeItem("discountCode");
    } catch (e) {
      console.error("Failed to remove discount code:", e);
    }
    return { success: false, message: "Please enter a discount code" };
  }

  const upperCode = code.trim().toUpperCase();

  if (DISCOUNT_CODES[upperCode]) {
    appliedDiscountCode = upperCode;
    try {
      localStorage.setItem("discountCode", upperCode);
    } catch (e) {
      console.error("Failed to save discount code:", e);
    }
    return {
      success: true,
      message: `✓ Code ${upperCode} applied! You get ${DISCOUNT_CODES[upperCode] * 100}% off`,
      discount: DISCOUNT_CODES[upperCode],
    };
  } else {
    appliedDiscountCode = null;
    try {
      localStorage.removeItem("discountCode");
    } catch (e) {
      console.error("Failed to remove discount code:", e);
    }
    return { success: false, message: "✗ Invalid discount code" };
  }
}

/**
 * Remove discount code
 */
export function removeDiscountCode() {
  appliedDiscountCode = null;
  try {
    localStorage.removeItem("discountCode");
  } catch (e) {
    console.error("Failed to remove discount code:", e);
  }
}

/**
 * Calculate discount code amount
 */
export function calculateDiscountCodeAmount(subtotal) {
  if (!appliedDiscountCode || !DISCOUNT_CODES[appliedDiscountCode]) {
    return 0;
  }
  return Math.round(subtotal * DISCOUNT_CODES[appliedDiscountCode]);
}

// ============================================================================
// BULK DISCOUNT LOGIC (PER PRODUCT)
// ============================================================================

/**
 * Calculate bulk discounts per product
 * Returns { total, bulkDiscounts }
 */
export function calculateBulkDiscounts(cart, isWeekend) {
  const bulkDiscounts = {};
  let total = 0;

  cart.forEach((item) => {
    const itemQuantity = item.quantity || 1;
    const itemPrice = isWeekend
      ? Math.round(item.price * WEEKEND_SURCHARGE)
      : item.price;
    let itemTotal = itemPrice * itemQuantity;

    // Apply 10% discount if this specific product has 10+ quantity
    if (itemQuantity >= 10) {
      const discount = Math.round(itemTotal * BULK_DISCOUNT_RATE);
      const productKey = item.name || item.id;
      bulkDiscounts[productKey] = (bulkDiscounts[productKey] || 0) + discount;
      itemTotal -= discount;
    }
    total += itemTotal;
  });

  return { total, bulkDiscounts };
}

// ============================================================================
// MONDAY DISCOUNT LOGIC
// ============================================================================

/**
 * Calculate Monday morning discount (before 10:00)
 */
export function calculateMondayDiscount(total) {
  const now = new Date();
  if (now.getDay() === 1 && now.getHours() < 10) {
    return Math.round(total * MONDAY_DISCOUNT_RATE);
  }
  return 0;
}

// ============================================================================
// SHIPPING COST LOGIC
// ============================================================================

/**
 * Calculate shipping cost
 * Free shipping if total items >= FREE_SHIPPING_THRESHOLD
 */
export function calculateShippingCost(cart, subtotal) {
  // Calculate total number of items
  let totalItems = 0;
  cart.forEach((item) => {
    totalItems += item.quantity || 1;
  });

  // Free shipping over threshold
  if (totalItems >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }

  return BASE_SHIPPING_COST + Math.round(subtotal * SHIPPING_PERCENTAGE);
}

// ============================================================================
// WEEKEND SURCHARGE CHECK
// ============================================================================

/**
 * Check if weekend surcharge applies
 * Weekend: Friday 15:00 to Monday 03:00
 */
export function isWeekendSurcharge() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  return (
    (day === 5 && hour >= 15) || // Friday after 15:00
    day === 6 || // Saturday
    day === 0 || // Sunday
    (day === 1 && hour < 3) // Monday before 03:00
  );
}

// ============================================================================
// BUILD DISCOUNT INFO HTML
// ============================================================================

/**
 * Build HTML for discount info display
 */
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

// ============================================================================
// CALCULATE ALL DISCOUNTS AND TOTAL
// ============================================================================

/**
 * Calculate complete cart total with all discounts
 * This is the SINGLE SOURCE OF TRUTH for all calculations
 */
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

  // Step 1: Calculate bulk discounts and subtotal (with weekend surcharge if applicable)
  const { total, bulkDiscounts } = calculateBulkDiscounts(cart, isWeekend);

  // Step 2: Calculate Monday discount
  const mondayDiscount = calculateMondayDiscount(total);
  const discountedTotal = total - mondayDiscount;

  // Step 3: Calculate shipping
  const shippingCost = calculateShippingCost(cart, discountedTotal);

  // Step 4: Calculate discount code on (discountedTotal + shipping)
  const discountCodeAmount = calculateDiscountCodeAmount(
    discountedTotal + shippingCost,
  );

  // Step 5: Calculate final total
  const finalTotal = discountedTotal + shippingCost - discountCodeAmount;

  return {
    subtotal: total,
    mondayDiscount,
    bulkDiscounts,
    shippingCost,
    discountCodeAmount,
    discountCode: appliedDiscountCode,
    finalTotal: Math.max(0, finalTotal), // Ensure never negative
  };
}
