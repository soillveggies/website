# So ILL Veggies — Website Boilerplate

Static HTML5 / CSS / JS site built for GitHub Pages (no server-side code), matching the project plan sitemap. Built on [Milligram](https://milligram.io) for grid, typography, buttons, and form styling.

## Structure

```
index.html                       Home              — dynamic-body, sheet: website_home + website_projects
projects.html                    Projects (list)   — dynamic-body, sheet: website_projects
project-detail.html              Project detail    — dynamic-body, sheet: website_projects, ?slug=<project-slug>
services.html                    Services          — dynamic-body, sheet: website_services
about-us.html                    About Us          — dynamic-body, sheet: website_aboutus
news-media.html                  Media & News       — dynamic-body, sheet: website_news
gallery.html                     Gallery            — dynamic-body (shell) + data-gallery-grid, sheet: website_gallery
contact.html                     Contact            — dynamic-body, sheet: website_contact
(every page)                     Footer             — <footer class="site-footer"></footer>, sheet: website_footer
css/styles.css                   Milligram import + color palette + minimal glue CSS
js/main.js                       Nav, footer, gallery loader/filter, and one buildBody*()
                                  render function per page that turns flat sheet rows into HTML
data/gallery.json                Local fallback gallery data (used if the Sheets feed is unreachable)
data/sheets/*.csv                One CSV per Google Sheet tab — import these into the spreadsheet
                                  that the Apps Script (google/google_appscript.gs) serves as JSON.
                                  Column headers become the JSON object keys automatically —
                                  no Apps Script changes are needed when a CSV is imported.
google/google_appscript.gs       Generic Sheet → JSON feed (unchanged; already handles any sheet).
```

## Footer

The footer is now shared and sheet-driven across every page, the same way the nav already was.
Each page just has an empty `<footer class="site-footer"></footer>`; `initFooter()` fills it in
from the `website_footer` sheet on load, before `initFooterYear()` runs. The `© <year>` year
itself is **not** stored in the sheet — it's still generated automatically from `Date().getFullYear()`
via the `[data-year]` span, exactly as before. The sheet only supplies the brand blurb, the
Explore/Connect link columns, and the copyright text/tagline around the year. Links whose `link`
value starts with `http`/`https` automatically get `target="_blank" rel="noopener"` (e.g. Facebook);
internal links (like `contact.html`) don't.

## Content model

Every page except Gallery and Navigation is rendered from a flat row schema:
`type, index, field, value, link` (the Projects sheet adds one more column, `group`,
which holds the project's slug so cards/then-now/video/CTA rows can be grouped per project).
This is the same pattern the Contact page's proof of concept established — a `type`/`field`
pair says *what* a row is (a hero eyebrow, a card title, a CTA link, …), `index` orders
repeating items (card 1, card 2, pipeline step 3, …), and `link` holds an href when the row
is a link or button. See any CSV in `data/sheets/` for concrete examples, and the
`buildBody*()` functions in `js/main.js` for how each sheet is turned into markup.

**Projects are fully dynamic.** There are no more standalone project HTML files. Adding,
removing, or editing a project only requires editing rows in the `website_projects` sheet —
`projects.html` lists every project (sorted by its `order` meta field) and links to
`project-detail.html?slug=<slug>`, which renders whichever project matches. The Home page's
"Three ways we put down roots" section also pulls its first three cards straight from
`website_projects`, so project copy only has to be edited in one place.

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

## Fixed: mobile nav not opening

`.site-header .row` never set `flex-direction`, so Milligram's own `.row` default
(`flex-direction: column` below its 640px breakpoint) governed the header layout on phones —
the brand, hamburger button, and nav all stacked vertically and got centered instead of sitting
in a normal horizontal bar. The toggle's click handler was firing correctly the whole time; the
layout around it was just broken enough on narrow screens that it could look non-functional.
Fixed by explicitly setting `flex-direction: row; flex-wrap: wrap;` on `.site-header .row` so it
no longer depends on Milligram's responsive default. Also added the (previously missing)
`type="button"` attribute to the toggle button as a defensive fix, since an unspecified
`<button>` type defaults to `"submit"`.

## Google Sheet setup

The Apps Script (`google/google_appscript.gs`) is fully generic: every tab in the spreadsheet
becomes a top-level key in the JSON feed, and each tab's header row becomes the JSON object
keys for its rows (skipping any row whose first column is blank, and a tab literally named
`README` is ignored entirely). **No Apps Script changes were needed for this update** — only
new sheet tabs.

1. In the spreadsheet the Apps Script serves, create one tab per CSV in `data/sheets/`, named
   exactly as the file (e.g. a tab named `website_home` for `website_home.csv`).
2. Import each CSV into its matching tab (File → Import → Upload, "Replace current sheet" or
   "Insert new sheet(s)", depending on whether the tab already exists).
3. The feed updates instantly on save — no redeploy needed. Redeploying (Deploy → Manage
   deployments → Edit → New version) is only required if `google_appscript.gs` itself changes.
4. `js/main.js` fetches the feed via the hardcoded `/exec` URL in `getData()`. Update that URL
   if the deployment ever changes.

## To do before launch

1. **Images**: every `.card-media` box is a placeholder with descriptive text. Replace with real photos (garden, hydroponics, microgreens, team, sponsors) — an `assets/` folder is included for this. Real images can also be dropped into `website_projects`, `website_home`, `website_services`, and `website_aboutus` rows the same way `website_gallery` already carries an `imageUrl` column, if/when the templates are extended to use them.
2. **Contact form**: swap the placeholder button/link on `contact.html` for the real published Google Form URL (edit the `card,1,form` row's `link` in `website_contact`).
3. **Gallery**: unchanged from the existing proof of concept — see `data/sheets/website_gallery.csv`. If the feed URL is blank or unreachable, the site falls back to `data/gallery.json`.
4. **Media links**: the School Story Magazine feature link is a placeholder — add the real URL to the `media,1` row's `link` column in `website_news` once available.
5. **Sponsor logos**: replace the `sponsor` rows' placeholder names in `website_aboutus` with real logos/acknowledgments (the template currently just prints the `name` value as text).
6. **Email/phone**: update the placeholder email in the `card,2,email` row of `website_contact` with the organization's real contact details.
7. Instagram is marked "Coming soon" throughout — update the relevant `link` values once the account is live (footer is still hardcoded in each page's HTML; consider moving it to `website_navigation` or a new sheet if it needs to change often).
8. **Project photos & then/now section order**: the unified `project-detail.html` template standardizes section order (Hero → overview cards → Then/Now *or* Video → CTAs) across all projects. The original hand-built Outdoor Garden Expansion page put its Then/Now comparison *before* the card grid with its own heading — that ordering was not preserved when the pages were unified. Content is unchanged, only position.

## Deploying to GitHub Pages

1. Push this folder's contents to the root of a GitHub repository (or a `/docs` folder, or a `gh-pages` branch — whichever you configure in Pages settings).
2. In the repo Settings → Pages, set the source to the branch/folder you used.
3. No build step is required — Milligram, normalize.css, and Google Fonts load from a CDN via `<link>` tags in each page's `<head>`; everything else is plain static HTML/CSS/JS.
