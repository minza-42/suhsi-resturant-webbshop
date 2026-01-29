/* Vite/SPA fallback: redirect all unknown routes to index.html */

// This file is for Vite or static hosting environments that support _redirects or similar rules.
// If you are using Netlify, add this file to the root of your project:
//
// /*    /index.html   200
//
// For Vercel, use vercel.json with rewrites.
// For GitHub Pages, use 404.html with a JS redirect below.

// For GitHub Pages: 404.html fallback to index.html
if (location.pathname !== "/" && !location.pathname.match(/^\/index\.html/)) {
  location.replace("/index.html");
}
