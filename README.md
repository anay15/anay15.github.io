# anay15.github.io

My portfolio: **https://anay15.github.io**

Hand-built static site, no framework and no build step, hosted on GitHub Pages.

- **Live system diagram** in the hero: requests flow through a FastAPI/Redis/Postgres/RabbitMQ topology while the counter climbs from 200 to 4,000 RPS (a real migration I did at IDfy)
- **⌘K / Ctrl K command palette** (or press `/`) to jump to sections, open the resume, copy my email
- Light and dark themes (follows your OS, remembers your choice), responsive from 360px up, respects `prefers-reduced-motion`
- Strict Content-Security-Policy (no inline scripts), semantic HTML, JSON-LD, Open Graph preview image

```
index.html               # the page
assets/css/site.css      # design tokens, layout, themes
assets/js/theme.js       # sets the theme before first paint (no flash)
assets/js/site.js        # diagram animation, counters, palette, copy-email
assets/img/              # project screenshots + og.png
tools/og.html            # source for the social preview image
```

**Run locally:** `python3 -m http.server 8090` then open http://localhost:8090

**Deploy:** pushing to `main` publishes via GitHub Pages.
