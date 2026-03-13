if (location.pathname !== "/" && !location.pathname.match(/^\/index\.html/)) {
  location.replace("/index.html");
}
