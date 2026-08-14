# So ILL Veggies — Website Boilerplate

Static HTML5 / CSS / JS site built for GitHub Pages (no server-side code), matching the project plan sitemap. Built on [Milligram](https://milligram.io) for grid, typography, buttons, and form styling.

## Structure

```
index.html                       Home
projects.html                    Projects (parent/list page)
projects/
  indoor-grow-operation.html
  outdoor-garden-expansion.html
  healing-illinois-grant.html
services.html
about-us.html
news-media.html
gallery.html
contact.html
css/styles.css                   Milligram import + color palette + minimal glue CSS
js/main.js                       Nav toggle, footer year, gallery loader/filter
data/gallery.json                Placeholder gallery data (JSON only, no server)
```

## Design system

- **Framework**: [Milligram](https://milligram.io) (loaded via CDN `<link>` tags in each page's `<head>`, alongside normalize.css and Google Fonts — in that order, before `css/styles.css`) supplies the grid (`.container` / `.row` / `.column`), type scale, buttons, forms, and tables. These are loaded as `<link>` tags rather than CSS `@import`, since `@import` chains load serially and can be dropped by some local servers, privacy extensions, or CSP setups.
- **Direction**: a bold, editorial "Modernist" style adapted from a Claude Design landing-page example — Archivo type (heavy 800-weight headings), sharp corners (no border-radius anywhere), numbered index markers (`01` / `02` / `03`), uppercase eyebrow labels, and a flat gray/near-black/green palette, all layered on top of Milligram's grid and reset.
- **Palette**: background `#f3f2f2`, surface `#eae9e9`, text `#201e1d`, single accent green `#4b8b23` (darker `#336114` for hover/eyebrow text), defined as CSS custom properties in `css/styles.css`.
- **Type**: Archivo for both headings and body (Google Fonts), weight 800 for headings, 400 for body text.
- **What's custom, and why**: Milligram intentionally only styles grid/type/buttons/forms/tables — it has no opinion on navbars, footers, or cards. `styles.css` adds the minimum glue needed for those:
  - `.site-header` / `.main-nav` — sticky-free nav bar with mobile toggle (Milligram has no nav component).
  - `.eyebrow` — small uppercase label used above headings.
  - `.index-num` — large bold numbered markers (pipeline steps, project cards).
  - `.project-card` / `.card-media` — a card layout with a grayscale-filtered placeholder image box, since Milligram has no card component.
  - `.split-cta` — the asymmetric (5fr/7fr) "get involved" layout.
  - `.cta-banner` — full-bleed accent-colored call-to-action band.
  - `.site-footer` — three-column footer built with Milligram's `.row` / `.column-33`.
  - `.video-embed` — responsive 16:9 wrapper for the Vimeo embed.
- Page layouts (project cards, team/board grids, then/now comparisons, gallery) all use Milligram's `.row` / `.column-*` grid classes, which stack automatically on narrow screens.

## To do before launch

1. **Images**: every `.card-media` box is a placeholder with descriptive text. Replace with real photos (garden, hydroponics, microgreens, team, sponsors) — an `assets/` folder is included for this.
2. **Contact form**: swap the placeholder button/link on `contact.html` for the real published Google Form URL.
3. **Gallery**: `data/gallery.json` is placeholder data. To pull from a public Google Drive folder, publish a JSON feed (e.g. via Google Apps Script) in the same shape (`title`, `category`, `alt`) and point the `fetch()` call in `js/main.js` at that URL. Gallery items render inside Milligram `.column-33` divs — adjust that class in `main.js` if you want a different number of columns.
4. **Media links**: the School Story Magazine feature link is a placeholder — add the real URL once available.
5. **Sponsor logos**: replace the dashed placeholder boxes on `about-us.html` with real logos and acknowledgments.
6. **Email/phone**: update the placeholder email on `contact.html` with the organization's real contact details.
7. Instagram is marked "Coming soon" throughout — update once the account is live.

## Deploying to GitHub Pages

1. Push this folder's contents to the root of a GitHub repository (or a `/docs` folder, or a `gh-pages` branch — whichever you configure in Pages settings).
2. In the repo Settings → Pages, set the source to the branch/folder you used.
3. No build step is required — Milligram, normalize.css, and Google Fonts load from a CDN via `<link>` tags in each page's `<head>`; everything else is plain static HTML/CSS/JS.
