#!/usr/bin/env python3
"""Build williamarana.pro into ./public.

Each page in pages/ holds only its <main> content. This script wraps every
page in the shared layout (head, header nav, footer) so the nav and footer
live in one place. No dependencies beyond the Python standard library.

    python3 build.py          # writes ./public
"""
import html
import shutil
from pathlib import Path

ROOT = Path(__file__).parent
OUT = ROOT / "public"
SITE = "https://williamarana.pro"

NAV = [
    ("Home", "/"),
    ("Portfolio", "/portfolio/"),
    ("GameDay", "/gameday/"),
    ("Dreamstate", "/dreamstate/"),
    ("Builds", "/builds/"),
    ("Next", "/next/"),
]

# source file in pages/  ->  (url path, <title>, meta description, active nav href)
PAGES = {
    "index.html": ("/", "William Arana", "William Arana, SDR in Santa Ana, CA, building sales tools with Claude.", "/"),
    "portfolio.html": ("/portfolio/", "Portfolio · William Arana", "SDR work samples: day board, prospect page, end of day review and more.", "/portfolio/"),
    "gameday.html": ("/gameday/", "GameDay · William Arana", "GameDay_stats, a fantasy football stats site at thegameday.zone.", "/gameday/"),
    "dreamstate.html": ("/dreamstate/", "Dreamstate · William Arana", "DS Companion, a fan site for Dreamstate SoCal 2026.", "/dreamstate/"),
    "builds.html": ("/builds/", "Builds · William Arana", "PhonePad, a floating Shorts player and Chrome extensions: small tools I built instead of paying for them.", "/builds/"),
    "next.html": ("/next/", "Next · William Arana", "What I'm building next: published extensions, Mac apps, more sports and more events.", "/next/"),
    "404.html": ("/404.html", "Page not found · William Arana", "This page doesn't exist.", None),
}

# Runs before paint so a saved dark choice doesn't flash light first.
THEME_INIT = (
    "<script>try{if(localStorage.getItem('wa-theme')==='dark')"
    "document.documentElement.setAttribute('data-theme','dark')}catch(e){}</script>"
)


def header(active):
    links = []
    for label, href in NAV:
        cur = ' aria-current="page"' if href == active else ""
        links.append(f'<a href="{href}"{cur}>{label}</a>')
    return (
        '<a class="skip" href="#main">Skip to content</a>\n'
        '<header class="site-header"><div class="wrap">\n'
        '  <a class="brand" href="/"><span>William Arana&#39;s</span><em>Projects</em></a>\n'
        f'  <nav class="nav" aria-label="Main">{"".join(links)}</nav>\n'
        '  <button id="theme-toggle" class="theme-toggle" type="button" aria-pressed="false">Dark mode</button>\n'
        "</div></header>"
    )


FOOTER = """<footer class="site-footer"><div class="wrap">
  <span>&copy; 2026 William Arana &middot; Santa Ana, CA</span>
  <nav aria-label="Contact">
    <a href="https://github.com/william-arana" rel="me">GitHub</a>
    <a href="https://www.linkedin.com/in/williamarana" rel="me">LinkedIn</a>
    <a href="mailto:wa@williamarana.pro">Email</a>
  </nav>
</div></footer>"""


def render(body, path, title, desc, active):
    canonical = SITE + (path if path != "/404.html" else "/")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{canonical}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{canonical}">
<meta name="theme-color" content="#DFE8D8">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/style.css">
{THEME_INIT}
<script src="/assets/site.js" defer></script>
</head>
<body>
{header(active)}
<main id="main">
{body.strip()}
</main>
{FOOTER}
</body>
</html>
"""


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    shutil.copytree(ROOT / "assets", OUT / "assets")
    for name in ("_redirects", "_headers", "robots.txt"):
        if (ROOT / name).exists():
            shutil.copy(ROOT / name, OUT / name)
    for src, (path, title, desc, active) in PAGES.items():
        body = (ROOT / "pages" / src).read_text()
        dest = OUT / (path.strip("/") or "") / "index.html" if path.endswith("/") else OUT / path.lstrip("/")
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(render(body, path, title, desc, active))
        print("built", dest.relative_to(ROOT))


if __name__ == "__main__":
    main()
