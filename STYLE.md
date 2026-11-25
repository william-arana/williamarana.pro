# williamarana.pro style guide

The source of truth for how this site looks and reads. Every new page follows it. Update it here when a decision changes.

## Feel

Deep forest and warm, yellow-leaning off-white. Calm, outdoorsy, professional. Two background layers:

- **Base shade:** a fade fixed to the screen. It stays still while content scrolls across it. Light mode fades off-white to white. Dark mode fades deep forest to black. Fades only ever go to white or black, never to another color.
- **Alternate shade:** a flat, solid color on `.shaded` sections that scrolls with the content. It has to be clearly different from the base, not a near match. Pages should feel built, not templated: big real screenshots, numbered sections, a story for every project.

## Color

### Light (default)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#F0E6C8` | Base shade, top of the fixed fade. Deeper and yellower than Steady Leads' `#F1EFE8` so the fade to white is obvious |
| `--fade-to` | `#FFFFFF` | Bottom of the fixed fade |
| `--surface` | `#FFFDF7` | Cards, tiles, frames |
| `--shade` | `#E8E0C8` | Alternate shade: flat, scrolls with content |
| `--ink` | `#1B2620` | Body text |
| `--muted` | `#55625A` | Secondary text |
| `--line` | `#D9D0B6` | Borders. Keep edges visible against the light background |
| `--forest` | `#2B5140` | Primary accent, links, buttons |
| `--forest-deep` | `#1F3D30` | Headings on tinted areas, hover |
| `--moss` | `#6F8F5E` | Secondary accent, tags |
| `--ember` | `#B5481A` | Small accents only: section number rules, badges. Never a background fade, never body text |

### Dark (toggle)

| Token | Hex |
|---|---|
| `--bg` | `#14281D` |
| `--fade-to` | `#000000` |
| `--surface` | `#1A2E23` |
| `--shade` | `#17291F` |
| `--ink` | `#E9EFE7` |
| `--muted` | `#A5B4A9` |
| `--line` | `#283B30` |
| `--forest` | `#86BC98` |
| `--forest-deep` | `#B5DCC1` |
| `--moss` | `#9DBB8A` |
| `--ember` | `#E2895A` |

Implementation: the base fade is a `body::before` layer with `position: fixed` (works on iPhone, unlike `background-attachment: fixed`), going `--bg` at the top, about halfway to `--fade-to` at 45%, and fully `--fade-to` by 85% of the screen height. `.shaded` sections use a flat `--shade` with a 1px `--line` border top and bottom.

## Shape

- Boxes, cards, buttons, inputs, badges: **small radii**. `--r: 4px` for cards and tiles, `--r-sm: 3px` for buttons, inputs, badges and nav pills. (That is about 60% less than the first version's 10px / 8px / pill shapes.) No pill-shaped badges.
- Images and screenshots keep their own rounding: screenshots 10px, app icons about 22% of their size.
- Borders over shadows. Shadows are soft and short when used.

## Type

- System sans stack (`-apple-system, Segoe UI, Inter, Roboto, Arial`). Easy to read, no web font loading.
- Big display headings (40 to 64px) with tight letter spacing for hero areas. Section labels are small caps style eyebrows: uppercase, 12 to 13px, letter spaced, in `--moss`.
- Body 16 to 17px, line height 1.6. Max line length around 70 characters.

## Layout

- Max content width 1120px.
- Home page: hero, then one dedicated section per project, alternating image side. Each section is numbered (01, 02...) and has: eyebrow, title, the problem, what I built, a short "how I got there", a goal, and links. Screenshots are the links.
- Desktop screenshots sit in a simple browser frame. Mobile screenshots sit in a phone frame.
- Shaded and unshaded sections alternate so the page has rhythm.

## Writing

- First person, direct, casual-professional. Specific over general: real features, real numbers, real decisions.
- Every project explains the problem, the thought process, how it got built, and what's next.
- **No em-dashes joining clauses.** Use a period, a comma or a colon.
- Never mention Steady Leads or SoCal Pallet Co.
- Leave the personal CRM and the Mac reset helper off the site for now. Selekt Collection lives on its own domain later.
- Work pages use fake demo data only. No real Nuve Home customers, leads or notes.
- Don't write claims about data handling or terms compliance unless William asks for them.
- Name on the site is "William Arana". Don't use "Bill" on the home page.

## Fidget toy

A kaleidoscope toy (`assets/fidget.js`) on every page, parked in the bottom-left corner of the browser window. Settings sit behind the cog in the header: show or hide the toy, version 1 (Shards, default) or version 2 (Julia mirror), auto mode (an endless fractal-style zoom that reveals new shapes on its own), and "Enable movement". With movement on you can drag and throw it anywhere on screen. It slows down, bounces off the edges and stays where it stops. With movement off it parks back in the bottom-left corner. Light and dark mode live in the same panel, under Appearance. Defaults: version 2 (Julia mirror) with auto mode on, movement and auto movement off. "Auto movement" makes it wander the screen like it is alive: it cruises, pauses, darts, leans into turns, breathes and steers away from edges. Clicks morph the pattern: shapes glide to new spots, colors blend, and each shape dips small at the midpoint where it changes form. No crossfades. Choices are saved per browser.

## Page changes

Internal links don't reload the page. `assets/site.js` fetches the next page, swaps `<main>`, the title and the nav highlight, and updates the URL, so the header, settings and fidget toy keep running with no interruption. Back/forward, anchors and new-tab clicks work as normal, and any failure falls back to a regular page load. Anything a page needs to set up (like the suggestions form) goes in `waInitPage()` so it runs after each swap.
