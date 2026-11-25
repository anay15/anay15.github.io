// Runs before first paint (loaded synchronously in <head>) so the page never
// flashes the wrong theme. Saved choice wins, otherwise follow the OS.
(function () {
  var theme = "dark";
  try {
    var saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") theme = saved;
    else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) theme = "light";
  } catch (e) {
    /* storage blocked: keep default */
  }
  document.documentElement.setAttribute("data-theme", theme);
})();
