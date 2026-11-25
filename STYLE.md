# williamarana.pro style guide

The source of truth for how this site looks and reads. Every new page follows it. Update it here when a decision changes.

## Feel

Deep forest and warm off-white. Calm, outdoorsy, professional. Backgrounds are shaded, never flat: light mode drifts from off-white into soft sage, dark mode drifts through deep forest greens. Pages should feel built, not templated: big real screenshots, numbered sections, a story for every project.

## Color

### Light (default)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#F8F6F0` | Page base. Cleaner, less yellow than the old portfolio's `#F4F1E8` |
| `--bg-2` | `#E8EEE5` | Bottom of the page gradient, soft sage |
| `--surface` | `#FDFCF8` | Cards, tiles, frames |
| `--shade` | `#EEF2EA` | Shaded sections |
| `--ink` | `#1B2620` | Body text |
| `--muted` | `#55625A` | Secondary text |
| `--line` | `#D5DCD1` | Borders. Keep edges visible against the light background |
| `--forest` | `#2B5140` | Primary accent, links, buttons |
| `--forest-deep` | `#1F3D30` | Headings on tinted areas, hover |
| `--moss` | `#6F8F5E` | Secondary accent, tags |
| `--ember` | `#B5481A` | Rare highlight only (one per screen at most) |

### Dark (toggle)

| Token | Hex |
|---|---|
| `--bg` | `#0C1611` |
| `--bg-2` | `#13271D` |
| `--surface` | `#15261D` |
| `--shade` | `#112018` |
| `--ink` | `#E9EFE7` |
| `--muted` | `#A5B4A9` |
| `--line` | `#283B30` |
| `--forest` | `#86BC98` |
| `--forest-deep` | `#B5DCC1` |
| `--moss` | `#9DBB8A` |
| `--ember` | `#E2895A` |

Dark mode keeps the shading: the page gradient runs `#0C1611` into `#13271D`, with a faint green glow behind hero areas.

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
- Never mention Steady Leads or SoCal Pallet Co. Selekt Collection lives on its own domain later.
- Work pages use fake demo data only. No real Nuve Home customers, leads or notes.
- Don't write claims about data handling or terms compliance unless William asks for them.
- Name on the site is "William Arana". Don't use "Bill" on the home page.
