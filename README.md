# 🍣 Minza's Sushi House

Welcome to my sushi e-commerce project! This is a web app where you can browse, filter, and order premium sushi and Japanese food online. I built it from scratch using only vanilla JavaScript, with a big focus on user experience, accessibility, and fun business logic.

**Live Demo:** [Try it here!](https://medieinstitutet.github.io/fed25d-js-intro-inl-1-minza-42/)

## Features

**Shopping**

- Browse and filter a full sushi menu
- Add items to your cart, adjust quantities (up to 20 per product)
- Cart is saved in your browser (localStorage)
- Cart times out after 15 minutes of inactivity

**Pricing & Discounts**

- Monday morning discount (10% off before 10:00)
- Weekend surcharge (15% extra from Friday 15:00 to Monday 03:00)
- Bulk discount (10% off if you buy 10+ of the same item)
- Discount codes: SUSHI10 (10%), SUSHI20 (20%)
- Free shipping if you order 15+ items, otherwise 25 SEK + 10% of cart

**Checkout**

- Full form validation with instant feedback
- Pay by card or invoice (invoice disabled for orders over 800 SEK)
- 15-minute timer on checkout
- GDPR consent required

**Design & Accessibility**

- Toggle between dark and light mode (your choice is saved)
- Works on all screen sizes (mobile, tablet, desktop)
- Touch-friendly and keyboard accessible
- Animations for a smooth experience

## Screenshots

**Desktop (Dark Mode):**
![Desktop Dark Mode](img/screenshots/Desktop-View-DM.jpg)

**Desktop (Light Mode):**
![Desktop Light Mode](img/screenshots/Desktop-View-LM.jpg)

**Mobile Cart Drawer:**

<img src="img/screenshots/Mobile-DM.jpg" alt="Mobile Cart" width="250"/>

**Tablet (iPad):**

<img src="img/screenshots/Tablet-DM.jpg" alt="Tablet View" width="350"/>

**Checkout Form:**
![Checkout Form](img/screenshots/Checkout-DM.jpg)

**HTML Validation:**
![HTML Validation Report](img/screenshots/HTML-Validation.jpg)

**CSS Validation:**
![CSS Validation Report](img/screenshots/CSS-Validation-a11y.jpg)
![CSS Validation Report](img/screenshots/CSS-Validation-cart.jpg)
![CSS Validation Report](img/screenshots/CSS-Validation-checkout.jpg)
![CSS Validation Report](img/screenshots/CSS-Validation-components.jpg)
![CSS Validation Report](img/screenshots/CSS-Validation-forms.jpg)
![CSS Validation Report](img/screenshots/CSS-Validation-layout.jpg)
![CSS Validation Report](img/screenshots/CSS-Validation-main.jpg)
![CSS Validation Report](img/screenshots/CSS-Validation-responsive.jpg)
![CSS Validation Report](img/screenshots/CSS-Validation-utilities.jpg)

## Tech Stack

- **HTML5** (semantic, accessible)
- **CSS3** (custom properties, grid, flexbox, animations)
- **Vanilla JavaScript (ES6+)** (modules, async/await, event delegation)
- Modular file structure for both JS and CSS
- Uses localStorage for cart and preferences
- Developed in VS Code, version controlled with Git

  ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
  ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
  ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
  ![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?style=for-the-badge&logo=githubpages&logoColor=white)

## Project Structure

```text
minza-sushi-house/
├── index.html                # Main entry point & app structure
├── README.md                 # Project documentation & VG-reports
│
├── css/                      # Modular CSS Architecture
│   ├── main.css              # Entry point for styles & @imports
│   ├── variables.css         # CSS Custom Properties (colors, spacing)
│   ├── layout.css            # Grid, header/footer & page structure
│   ├── components.css        # Reusable UI (product cards, buttons)
│   ├── forms.css             # Form inputs & validation styling
│   ├── cart.css              # Shopping cart drawer & overlay
│   ├── checkout.css          # Specific styles for the checkout modal
│   ├── utilities.css         # Animations & accessibility helpers
│   ├── responsive.css        # Media queries (Mobile-first approach)
│   └── a11y-product.css      # Screen reader & focus enhancements
│
├── src/                      # JavaScript Logic (ES-Modules)
│   ├── main.js               # Product rendering & cart management
│   ├── checkout.js           # Form validation & checkout timeout
│   ├── discounts.js          # Pricing engine & business rules
│   └── theme.js              # Dark/light mode state & logic
│
└── img/                      # Assets
    └── screenshots/          # Validation & Lighthouse reports
```

## Getting Started

**You need:**

- A modern browser (Chrome, Firefox, Safari, Edge)
- (Optional) A local web server for development

**To run locally:**

1. Clone the repo:
   ```bash
   git clone https://github.com/yourusername/minza-sushi-house.git
   cd minza-sushi-house
   ```
2. Open `index.html` in your browser, or run a local server:
   ```bash
   python -m http.server 8000
   # Go to http://localhost:8000
   ```
3. Shop, add to cart, test discounts, and try the checkout!

## How to Test Discounts

**Monday Discount:**

- Try the site on a Monday before 10:00 and you’ll get 10% off automatically.

**Weekend Surcharge:**

- Shop Friday after 15:00, Saturday, Sunday, or early Monday and prices are 15% higher (but you won’t see a warning).

**Bulk Discount:**

- Add 10 or more of the same product to your cart for 10% off that item.

**Discount Codes:**

- Use SUSHI10 or SUSHI20 at checkout for extra discounts.

**Free Shipping:**

- Order 15+ items and shipping is free.

**Invoice Limit:**

- If your cart is over 800 SEK, invoice payment is disabled.

## Accessibility

- ARIA labels on all buttons and forms
- Full keyboard navigation (Tab, Enter, Space)
- Works with screen readers
- Focus indicators everywhere
- Respects "reduced motion" settings
- Good color contrast
- Large enough touch targets for mobile

## Responsive Design

- **Mobile Small:** 320px - 360px
- **Mobile:** 361px - 480px
- **Mobile Large:** 481px - 600px
- **Tablet:** 601px - 800px
- **Desktop Small:** 801px - 1100px
- **Desktop:** 1100px+
- **Landscape:** Optimized for short screens

## Business Rules

All the special rules for Minza's Sushi House are in place and tested:

1. Monday discount (10% before 10:00)
2. Weekend surcharge (15% Friday 15:00 - Monday 03:00)
3. Invoice blocked above 800 SEK
4. Bulk discount (10+ of same product)
5. Free shipping (15+ items)
6. 15-minute checkout timeout

## Code Quality

- HTML and CSS validated (W3C)
- Consistent English naming
- Semantic HTML5

## Future Ideas

- Backend with Node.js/Express
- Database for products/orders
- User login and order history
- Payment integration (Stripe/Klarna)
- Email confirmations
- Admin panel for products
- Multi-language (Swedish/English)
- PWA features

## Thanks

- **Fonts:** Google Fonts (Potta One, Zen Antique)
- **Icons:** Facebook and Instagram icons from IconScout. Other SVG icons from Google Icons.
- **Images:** Product images are AI-generated with Google Gemini.

---

Made with ❤️ and 🍣 by Minai Karlsson
