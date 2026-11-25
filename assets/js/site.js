// Portfolio interactions: theme toggle, live system diagram, number counters,
// scroll reveals, ⌘K command palette and copy-email. No dependencies.
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  // ───────────── toast + clipboard ─────────────
  const toastEl = $("[data-toast]");
  let toastTimer;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
  }
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard");
    } catch {
      toast(text); // clipboard blocked: at least show it
    }
  }
  $$("[data-copy]").forEach((btn) => btn.addEventListener("click", () => copy(btn.dataset.copy)));

  // ───────────── theme ─────────────
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* private mode */
    }
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = theme === "light" ? "#f7f8fa" : "#0b0f14";
  }
  const toggleTheme = () => setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
  $$("[data-toggle-theme]").forEach((b) => b.addEventListener("click", toggleTheme));

  // ───────────── live system diagram ─────────────
  // Packets travel the request path; the RPS counter climbs from the
  // monolith's 200 to the microservices' 4,000, then holds.
  const SVG_NS = "http://www.w3.org/2000/svg";
  const packetLayer = $("[data-packets]");
  const rpsEl = $("[data-rps]");
  const routes = [
    ["e1", "e2", "e5"], ["e1", "e3", "e6"], ["e1", "e4", "e7"],
    ["e1", "e2", "e8"], ["e1", "e4", "e9"], ["e1", "e3", "e6"],
  ];

  function animateRps(duration = 3200) {
    if (!rpsEl) return;
    const from = 200, to = 4000;
    if (reducedMotion) { rpsEl.textContent = to.toLocaleString("en-IN"); return; }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      rpsEl.textContent = Math.round(from + (to - from) * eased).toLocaleString("en-IN");
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function spawnPacket(level) {
    const route = routes[Math.floor(Math.random() * routes.length)].map((id) => document.getElementById(id));
    if (route.some((p) => !p)) return;
    const dot = document.createElementNS(SVG_NS, "circle");
    dot.setAttribute("r", "3");
    if (Math.random() < 0.35) dot.classList.add("fast");
    packetLayer.appendChild(dot);
    const lengths = route.map((p) => p.getTotalLength());
    const total = lengths.reduce((a, b) => a + b, 0);
    const speed = 0.16 + level * 0.1; // px per ms: faster as throughput rises
    const start = performance.now();
    const step = (now) => {
      let d = (now - start) * speed;
      if (d >= total) { dot.remove(); return; }
      let i = 0;
      while (d > lengths[i]) { d -= lengths[i]; i += 1; }
      const pt = route[i].getPointAtLength(d);
      dot.setAttribute("cx", pt.x.toFixed(1));
      dot.setAttribute("cy", pt.y.toFixed(1));
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  if (packetLayer && !reducedMotion) {
    const started = performance.now();
    let last = 0;
    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe($(".system"));
    const loop = (now) => {
      const level = Math.min(1, (now - started) / 3200); // 0 → 1 as RPS climbs
      const interval = 520 - level * 400; // more packets at higher RPS
      if (visible && !document.hidden && now - last > interval && packetLayer.childElementCount < 40) {
        last = now;
        spawnPacket(level);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  animateRps();

  // ───────────── counters + reveal on scroll ─────────────
  function countUp(el) {
    const target = Number(el.dataset.count);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    if (reducedMotion || !Number.isFinite(target)) return;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1200);
      el.textContent = prefix + Math.round(target * (1 - Math.pow(1 - t, 3))) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const revealTargets = $$(".impact, .role, .feature, .card, .stack__group, .edu, .contact");
  if ("IntersectionObserver" in window && !reducedMotion) {
    revealTargets.forEach((el) => el.classList.add("reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        $$("[data-count]", entry.target).forEach(countUp);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    revealTargets.forEach((el) => io.observe(el));
  }

  // ───────────── command palette ─────────────
  const palette = $("[data-palette]");
  const input = $(".palette__input", palette);
  const list = $(".palette__list", palette);
  const go = (hash) => () => document.querySelector(hash)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  const open = (url) => () => window.open(url, "_blank", "noopener");
  const COMMANDS = [
    { label: "Go to experience", hint: "section", run: go("#work") },
    { label: "Go to projects", hint: "section", run: go("#projects") },
    { label: "Go to stack", hint: "section", run: go("#stack") },
    { label: "Go to contact", hint: "section", run: go("#contact") },
    { label: "Open resume (PDF)", hint: "file", run: open("Anay_Nayak_Resume.pdf") },
    { label: "Copy email address", hint: "action", run: () => copy("nayakanay15@gmail.com") },
    { label: "Send an email", hint: "mailto", run: () => { window.location.href = "mailto:nayakanay15@gmail.com"; } },
    { label: "Open GitHub", hint: "link", run: open("https://github.com/anay15") },
    { label: "Open LinkedIn", hint: "link", run: open("https://www.linkedin.com/in/nayakanay") },
    { label: "Open Prana (live demo)", hint: "project", run: open("https://prana-yjwl.onrender.com") },
    { label: "Open ForkFinder (live demo)", hint: "project", run: open("https://forkfinder.onrender.com") },
    { label: "Toggle light / dark theme", hint: "action", run: toggleTheme },
  ];
  let results = COMMANDS;
  let active = 0;
  let lastFocus = null;

  function render() {
    list.replaceChildren();
    if (!results.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "No matches";
      list.appendChild(li);
      return;
    }
    results.forEach((cmd, i) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(i === active));
      const label = document.createElement("span");
      label.textContent = cmd.label; // textContent: never injects HTML
      const hint = document.createElement("span");
      hint.textContent = cmd.hint;
      li.append(label, hint);
      li.addEventListener("mousemove", () => { if (active !== i) { active = i; render(); } });
      li.addEventListener("click", () => choose(i));
      list.appendChild(li);
    });
    list.children[active]?.scrollIntoView({ block: "nearest" });
  }

  function filter(query) {
    const q = query.trim().toLowerCase();
    results = q ? COMMANDS.filter((c) => (c.label + " " + c.hint).toLowerCase().includes(q)) : COMMANDS;
    active = 0;
    render();
  }

  function openPalette() {
    lastFocus = document.activeElement;
    palette.hidden = false;
    input.value = "";
    filter("");
    input.focus();
  }
  function closePalette() {
    palette.hidden = true;
    lastFocus?.focus?.();
  }
  function choose(i) {
    const cmd = results[i];
    if (!cmd) return;
    closePalette();
    cmd.run();
  }

  $$("[data-open-palette]").forEach((b) => b.addEventListener("click", openPalette));
  $$("[data-close-palette]").forEach((b) => b.addEventListener("click", closePalette));
  input.addEventListener("input", () => filter(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % Math.max(results.length, 1); render(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + results.length) % Math.max(results.length, 1); render(); }
    else if (e.key === "Enter") { e.preventDefault(); choose(active); }
    else if (e.key === "Tab") { e.preventDefault(); } // keep focus in the dialog
  });
  document.addEventListener("keydown", (e) => {
    const typing = /input|textarea|select/i.test(document.activeElement?.tagName || "");
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette.hidden ? openPalette() : closePalette(); }
    else if (e.key === "/" && !typing && palette.hidden) { e.preventDefault(); openPalette(); }
    else if (e.key === "Escape" && !palette.hidden) closePalette();
  });
  if (!isMac) $$("[data-mod-key]").forEach((k) => { k.textContent = "Ctrl K"; });

  // ───────────── misc ─────────────
  $$("[data-year]").forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
