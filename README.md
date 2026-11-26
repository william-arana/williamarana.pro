# williamarana.pro

Personal site. Plain HTML, CSS and JS, deployed on Cloudflare Pages.

- `pages/` holds each page's main content
- `assets/` holds shared CSS, JS, the favicon, app icons (`assets/icons/`) and share images (`assets/og/`)
- `favicon.ico`, `apple-touch-icon.png` and `site.webmanifest` sit at the root and get copied into `public/`
- `build.py` wraps every page in the shared header and footer and writes `public/`

Build locally: `python3 build.py`, then `python3 -m http.server -d public 8000`.

Cloudflare Pages settings: build command `python3 build.py`, output directory `public`.
