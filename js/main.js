/* ==========================================================================
   So ILL Veggies — shared site behavior
   Vanilla JS only (no build step / no server), per project requirements.
   ========================================================================== */

// Dynamically Generate Nav Links from Google Sheets
async function constructNavMenu(navData) {
    const navList = [];
    navData.forEach(function(link) {
        let navButton = `<li><a href="${link.href}">${link.label}</a></li>`;
        navList.push(navButton);
    })
    return navList;
}

// Generate Nav & Enable Mobile Toggle
async function initNavMenu(siteData) {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".main-nav");
    if (!toggle || !nav) return;

    let navList = await constructNavMenu(siteData.website_navigation);
    nav.innerHTML = `<ul>${navList.join('\n')}</ul>`;
    // Implement CTA Button?
    // <li><a class="button" href="contact.html" style="text-decoration:none;">Book a service</a></li>

    // Toggle Mobile Menu
    toggle.addEventListener("click", function () {
        var isOpen = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Close menu when a link is chosen (mobile)
    nav.addEventListener("click", function (e) {
        if (e.target.tagName === "A" && nav.classList.contains("is-open")) {
            nav.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
        }
    });
}

// Build Footer (shared across every page). The "© <year>" year itself
// stays automatic via initFooterYear() — the sheet only supplies the text
// around it, plus the brand blurb and the Explore/Connect link columns.
function buildFooter(rows) {
    var brandHeading = getValue(rows, "brand", "heading");
    var brandDescription = getValue(rows, "brand", "description");

    var exploreHeading = getValue(rows, "explore", "heading");
    var exploreLinks = getIndices(rows, "explore").map(function (idx) {
        var label = getValue(rows, "explore", "link", idx);
        var link = getLink(rows, "explore", "link", idx);
        return "<li><a href=\"" + link + "\">" + label + "</a></li>";
    }).join("\n");

    var connectHeading = getValue(rows, "connect", "heading");
    var connectLinks = getIndices(rows, "connect").map(function (idx) {
        var label = getValue(rows, "connect", "link", idx);
        var link = getLink(rows, "connect", "link", idx);
        var isExternal = /^https?:\/\//i.test(link);
        var attrs = isExternal ? " target=\"_blank\" rel=\"noopener\"" : "";
        return "<li><a href=\"" + link + "\"" + attrs + ">" + label + "</a></li>";
    }).join("\n");

    var copyrightPrefix = getValue(rows, "bottom", "copyrightPrefix");
    var copyrightSuffix = getValue(rows, "bottom", "copyrightSuffix");
    var tagline = getValue(rows, "bottom", "tagline");

    return (
        '<div class="container">' +
        '<div class="row">' +
        '<div class="column column-33">' +
        "<h4>" + brandHeading + "</h4>" +
        "<p>" + brandDescription + "</p>" +
        "</div>" +
        '<div class="column column-33">' +
        "<h4>" + exploreHeading + "</h4>" +
        "<ul>" + exploreLinks + "</ul>" +
        "</div>" +
        '<div class="column column-33">' +
        "<h4>" + connectHeading + "</h4>" +
        "<ul>" + connectLinks + "</ul>" +
        "</div>" +
        "</div>" +
        '<div class="footer-bottom">' +
        "<span>" + copyrightPrefix + '<span data-year>2026</span>' + copyrightSuffix + "</span>" +
        "<span>" + tagline + "</span>" +
        "</div>" +
        "</div>"
    );
}

function initFooter(siteData) {
    var footer = document.querySelector(".site-footer");
    if (!footer) return;
    footer.innerHTML = buildFooter((siteData && siteData.website_footer) || []);
}

// Auto Update Footer Year
function initFooterYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
}


/* ---- Gallery: load from the Apps Script feed (falls back to the
   local data/gallery.json placeholder if the feed URL is empty or
   unreachable) and filter by category ------------------------------- */
async function loadGalleryData(siteData) {
    var localFallback = function () {
        return fetch("data/gallery.json")
            .then(function (res) {
                if (!res.ok) throw new Error("gallery.json not found");
                return res.json();
            })
            .catch(function () {
                return [];
            });
    };

    if (!siteData) {
        return localFallback();
    } else {
        console.log(siteData.website_gallery);
        return siteData.website_gallery;
    }
}

async function renderGallery(items, activeFilter) {
    var grid = document.querySelector("[data-gallery-grid]");
    var empty = document.querySelector("[data-gallery-empty]");
    if (!grid) return;

    var filtered = activeFilter && activeFilter !== "all"
        ? items.filter(function (i) { return i.category === activeFilter; })
        : items;

    grid.innerHTML = "";

    if (!filtered.length) {
        if (empty) empty.hidden = false;
        return;
    }
    if (empty) empty.hidden = true;

    filtered.forEach(function (item) {
        var column = document.createElement("div");
        column.className = "column column-33";
        var figure = document.createElement("figure");
        var media = document.createElement("div");
        media.className = "card-media";
        if (item.imageUrl) {
            media.style.backgroundImage = "url('" + item.imageUrl + "')";
            media.style.backgroundSize = "cover";
            media.style.backgroundPosition = "center";
            media.setAttribute("role", "img");
            media.setAttribute("aria-label", item.alt || item.title || "");
        } else {
            media.textContent = item.alt || item.title || "Photo placeholder";
        }
        var caption = document.createElement("figcaption");
        caption.textContent = item.title || "";
        figure.appendChild(media);
        figure.appendChild(caption);
        column.appendChild(figure);
        grid.appendChild(column);
    });
}

// Build Gallery Page Shell (the grid itself is populated by initGallery,
// after this markup exists in the DOM — see initPageData).
function buildBodyGallery() {
    return (
        '<section class="hero" style="padding-bottom: var(--space-6);">' +
        '<div class="container">' +
        '<span class="eyebrow">Archive</span>' +
        '<h1 style="font-size: clamp(2.2rem, 4.4vw, 3.4rem);">Photo Gallery</h1>' +
        '<p class="lede" style="max-width: 62ch;">Photos from indoor grows, outdoor gardens, hydroponics, and community events.</p>' +
        "</div>" +
        "</section>" +

        "<section>" +
        '<div class="container">' +
        '<div class="gallery-filters" role="group" aria-label="Filter gallery by category">' +
        '<button type="button" class="filter-btn" data-filter="all" aria-pressed="true">All</button>' +
        '<button type="button" class="filter-btn" data-filter="indoor" aria-pressed="false">Indoor grow</button>' +
        '<button type="button" class="filter-btn" data-filter="outdoor" aria-pressed="false">Outdoor garden</button>' +
        '<button type="button" class="filter-btn" data-filter="events" aria-pressed="false">Events</button>' +
        '<button type="button" class="filter-btn" data-filter="hydroponics" aria-pressed="false">Hydroponics</button>' +
        "</div>" +
        '<p class="gallery-empty" data-gallery-empty hidden>No photos in this category yet.</p>' +
        '<div class="row gallery-grid" data-gallery-grid aria-live="polite"></div>' +
        "</div>" +
        "</section>"
    );
}

// Initilaize the Gallery only when on the Correct Page
async function initGallery(siteData) {
    var grid = document.querySelector("[data-gallery-grid]");
    if (grid) {
        var filterButtons = document.querySelectorAll(".filter-btn");
        var currentFilter = "all";

        await loadGalleryData(siteData)
            .then(function (res) {
                renderGallery(res, currentFilter);

                filterButtons.forEach(function (btn) {
                    btn.addEventListener("click", function () {
                        filterButtons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
                        btn.setAttribute("aria-pressed", "true");
                        currentFilter = btn.getAttribute("data-filter");
                        renderGallery(res, currentFilter);
                    });
                });
            });
    } else {
        return // not on gallery page
    }
}

// Build Contact Page Dynamically
function buildBodyContact (data, element) {

    let contactTitle = data;
    let contactDescription = data;

    // Process Rows into Card Arrays
    let cards = {};
    data.forEach(function (row) {
        if (row.type === "text" && row.field === "title" && row.index == "0") {
            contactTitle = row.value;
        }
        if (row.type === "text" && row.field === "description" && row.index == "0") {
            contactDescription = row.value;
        }
        if (row.type === "card") {
            if (cards[row.index]) {
                cards[row.index].push(row);
            } else {
                cards[row.index] = [];
                cards[row.index].push(row);
            }
        }
    });

    htmlCardList = [];
    Object.values(cards).forEach(function (card) {

        let cardTitle = '';
        let cardDescription = '';
        let contactForm = '';
        let contactEmail = '';
        let contactLinks = [];

        card.forEach(function (row) {
            if (row.field == "title") {
                cardTitle = row.value;
            }
            if (row.field == "description") {
                cardDescription = row.value;
            }
            if (row.field == "form") {
                let contactFormValue = row.value;
                let contactFormLink = row.link;
                let formTemplate = `<p style="margin-top: var(--space-4);"><a class="button" href="${contactFormLink}" aria-disabled="true">${contactFormValue}</a></p>`;
                contactForm = formTemplate;
            }
            if (row.field == "email") {
                let contactEmailValue = row.value;
                let contactEmailLink = row.link;
                let emailTemplate = `<li>Email: <a href="mailto:${contactEmailLink}">${contactEmailValue}</a></li>`;
                contactEmail = emailTemplate;
            }
            if (row.field == "link") {
                let contactLinkValue = row.value;
                let contactLink = row.link;
                if (contactLink && !/^https?:\/\//i.test(contactLink)) {
                    console.log("Fix Missing Link Protocol: ", contactLink);
                    contactLink = 'https://' + contactLink;
                }
                let linkTemplate = `<li><a href="${contactLink}" target="_blank" rel="noopener">${contactLinkValue}</a></li>`;
                contactLinks.push(linkTemplate);
            }
        });

        let listTemplate = '';

        if (contactForm) {
            listTemplate = contactForm;
        }

        if (contactEmail) {
            listTemplate = `<ul class="contact-list" style="margin-top: var(--space-3);">${contactEmail}</ul>`;
        }

        if (contactLinks.length) {
            listTemplate = `<ul class="contact-list" style="margin-top: var(--space-3);">${contactLinks.join('\n')}</ul>`;
        }

        let cardTemplate = `
            <div class="column column-33">
            <div class="form-note">
            <h3 style="font-size: 1.2rem;">${cardTitle}</h3>
            <p style="color: var(--color-text-soft); margin-top: var(--space-3);">${cardDescription}</p>
            ${listTemplate}
            </div>
            </div>
        `

        htmlCardList.push(cardTemplate);
    });

    let bodyTemplate = `
        <section class="hero hero-home-bg" style="padding-bottom: var(--space-6);">
        <div class="container">
        <span class="eyebrow">Contact</span>
        <h1 style="font-size: clamp(2.2rem, 4.4vw, 3.4rem);">${contactTitle}</h1>
        <p class="lede" style="max-width: 62ch;">${contactDescription}</p>
        </div>
        </section>
        <section>
        <div class="container">
        <div class="row" style="border-top: 2px solid var(--color-divider); padding-top: var(--space-8);">${htmlCardList.join('\n')}</div>
        </div>
        </section>
    `
    // console.log(bodyTemplate);
    return bodyTemplate;   
}

/* ==========================================================================
   Generic row helpers — shared by every buildBody* function below.
   All sheets (except website_gallery, which stays a flat item list, and
   website_navigation) use the same flat row shape:
     type | index | field | value | link
   (website_projects adds one more column: "group", the project slug.)
   ========================================================================== */

// Find a single row matching type/field, optionally at a given index.
// Rows with no index (site-level fields, e.g. a hero) are matched when
// `index` is omitted.
function findRow(rows, type, field, index) {
    for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (r.type !== type || r.field !== field) continue;
        if (index !== undefined) {
            if (String(r.index) === String(index)) return r;
        } else if (r.index === undefined || r.index === null || r.index === "") {
            return r;
        }
    }
    return null;
}

function getValue(rows, type, field, index) {
    var row = findRow(rows, type, field, index);
    return row && row.value !== undefined ? row.value : "";
}

function getLink(rows, type, field, index) {
    var row = findRow(rows, type, field, index);
    return row && row.link ? row.link : "";
}

// Returns the sorted list of distinct index values used by a given type
// (e.g. every "card" index, so we know how many cards to render).
function getIndices(rows, type) {
    var seen = {};
    rows.forEach(function (r) {
        if (r.type === type && r.index !== undefined && r.index !== null && r.index !== "") {
            seen[r.index] = true;
        }
    });
    return Object.keys(seen).sort(function (a, b) { return Number(a) - Number(b); });
}

// Ensures external links always have a protocol (mirrors the fix already
// used for contact "link" rows).
function normalizeLink(link) {
    if (link && !/^https?:\/\//i.test(link) && !/^[.#/]/.test(link) && !/\.html/i.test(link)) {
        return "https://" + link;
    }
    return link;
}

/* ---- Projects: shared parsing for website_projects rows ----------------
   Each row belongs to a project via the "group" column (the project slug).
   type=meta   -> field/value become a property directly on the project
                  (title, order, category, listSummary, listMediaAlt,
                  heroEyebrow, heroDescription, thennowEyebrow, thennowHeading,
                  videoEyebrow, videoHeading, etc.)
   type=card   -> index 1..3, field=title/description/mediaAlt
   type=thennow-> index 1=then, 2=now, field=mediaAlt/caption
   type=video  -> field=embedUrl/link
   type=cta    -> index 1..2, value=label, link=href
   Rows with a blank "group" describe the projects LIST page's own hero
   (type=listHero, field=eyebrow/heading/lede).
   -------------------------------------------------------------------- */
function parseProjects(rows) {
    var map = {};
    rows.forEach(function (r) {
        var slug = r.group;
        if (!slug) return;
        if (!map[slug]) map[slug] = { slug: slug, cards: [], ctas: [] };
        var p = map[slug];

        if (r.type === "meta") {
            p[r.field] = r.value;
        } else if (r.type === "card") {
            var ci = Number(r.index) - 1;
            if (!p.cards[ci]) p.cards[ci] = {};
            p.cards[ci][r.field] = r.value;
        } else if (r.type === "thennow") {
            if (!p.thennow) p.thennow = {};
            var prefix = String(r.index) === "1" ? "then" : "now";
            p.thennow[prefix + "_" + r.field] = r.value;
        } else if (r.type === "video") {
            if (!p.video) p.video = {};
            p.video[r.field] = r.value;
        } else if (r.type === "cta") {
            var xi = Number(r.index) - 1;
            p.ctas[xi] = { label: r.value, link: r.link };
        }
    });

    var list = Object.keys(map).map(function (k) { return map[k]; });
    list.forEach(function (p) {
        p.cards = p.cards.filter(Boolean);
        p.ctas = p.ctas.filter(Boolean);
    });
    list.sort(function (a, b) { return Number(a.order || 0) - Number(b.order || 0); });
    return list;
}

function padIndex(n) {
    return n < 10 ? "0" + n : String(n);
}

// Card used on the Home page's "Three ways we put down roots" section.
function homeProjectCardTemplate(project, position) {
    return (
        '<div class="column column-33">' +
        '<article class="project-card">' +
        '<div class="card-media">' + (project.listMediaAlt || "") + "</div>" +
        '<span class="index-num">' + padIndex(position) + "</span>" +
        "<h3>" + (project.title || "") + "</h3>" +
        "<p>" + (project.listSummary || "") + "</p>" +
        '<a class="read-more" href="project-detail.html?slug=' + encodeURIComponent(project.slug) + '">Read the project →</a>' +
        "</article>" +
        "</div>"
    );
}

// Card used on the Projects list page.
function projectsListCardTemplate(project) {
    return (
        '<div class="column column-33">' +
        '<article class="project-card">' +
        '<div class="card-media">' + (project.listMediaAlt || "") + "</div>" +
        '<span class="eyebrow" style="margin-bottom: var(--space-2);">' + (project.category || "") + "</span>" +
        "<h3>" + (project.title || "") + "</h3>" +
        "<p>" + (project.listSummary || "") + "</p>" +
        '<a class="read-more" href="project-detail.html?slug=' + encodeURIComponent(project.slug) + '">View project details →</a>' +
        "</article>" +
        "</div>"
    );
}

/* ---- Build: Home --------------------------------------------------- */
function buildBodyHome(homeRows, projectRows) {
    var eyebrow = getValue(homeRows, "hero", "eyebrow");
    var heading1 = getValue(homeRows, "hero", "heading1");
    var heading2 = getValue(homeRows, "hero", "heading2");
    var heading3 = getValue(homeRows, "hero", "heading3");
    var lede = getValue(homeRows, "hero", "lede");
    var ctaPrimaryLabel = getValue(homeRows, "hero", "ctaPrimaryLabel");
    var ctaPrimaryLink = getLink(homeRows, "hero", "ctaPrimaryLabel");
    var ctaSecondaryLabel = getValue(homeRows, "hero", "ctaSecondaryLabel");
    var ctaSecondaryLink = getLink(homeRows, "hero", "ctaSecondaryLabel");

    var pipelineItems = getIndices(homeRows, "pipeline").map(function (idx) {
        var label = getValue(homeRows, "pipeline", "label", idx);
        return "<li><span class=\"index-num\">" + padIndex(Number(idx)) + "</span><span class=\"label\">" + label + "</span></li>";
    }).join("\n");

    var projectsEyebrow = getValue(homeRows, "projectsIntro", "eyebrow");
    var projectsHeading = getValue(homeRows, "projectsIntro", "heading");
    var projectsLede = getValue(homeRows, "projectsIntro", "lede");

    var projects = parseProjects(projectRows).slice(0, 3);
    var projectCards = projects.map(function (p, i) { return homeProjectCardTemplate(p, i + 1); }).join("\n");

    var involvedEyebrow = getValue(homeRows, "involved", "eyebrow");
    var involvedHeading = getValue(homeRows, "involved", "heading");
    var involvedLede = getValue(homeRows, "involved", "lede");
    var involvedCtas = getIndices(homeRows, "involved").map(function (idx) {
        var label = getValue(homeRows, "involved", "ctaLabel", idx);
        var link = getLink(homeRows, "involved", "ctaLabel", idx);
        var cls = idx === "1" ? "button" : "button button-ghost";
        return '<a class="' + cls + '" href="' + link + '">' + label + "</a>";
    }).join("\n");

    var bannerHeading1 = getValue(homeRows, "banner", "heading1");
    var bannerHeading2 = getValue(homeRows, "banner", "heading2");
    var bannerCtas = getIndices(homeRows, "banner").map(function (idx) {
        var label = getValue(homeRows, "banner", "ctaLabel", idx);
        var link = getLink(homeRows, "banner", "ctaLabel", idx);
        return '<a class="button button-ghost" href="' + link + '">' + label + "</a>";
    }).join("\n");

    return (
        '<section class="hero">' +
        '<div class="container">' +
        '<span class="eyebrow">' + eyebrow + "</span>" +
        "<h1>" + heading1 + "<br>" + heading2 + '<br><span style="color: var(--color-accent);">' + heading3 + "</span></h1>" +
        '<p class="lede">' + lede + "</p>" +
        '<div class="cta-row">' +
        '<a class="button" href="' + ctaPrimaryLink + '">' + ctaPrimaryLabel + "</a>" +
        '<a class="button button-ghost" href="' + ctaSecondaryLink + '">' + ctaSecondaryLabel + "</a>" +
        "</div>" +
        '<ul class="pipeline-strip" aria-hidden="true">' + pipelineItems + "</ul>" +
        "</div>" +
        "</section>" +

        "<section>" +
        '<div class="container">' +
        '<span class="eyebrow">' + projectsEyebrow + "</span>" +
        "<h2>" + projectsHeading + "</h2>" +
        '<p class="lede" style="margin-top: var(--space-6); font-size: 1.05rem;">' + projectsLede + "</p>" +
        '<div class="row project-grid">' + projectCards + "</div>" +
        "</div>" +
        "</section>" +

        "<section>" +
        '<div class="container">' +
        '<div class="split-cta">' +
        "<div>" +
        '<span class="eyebrow">' + involvedEyebrow + "</span>" +
        "<h2>" + involvedHeading + "</h2>" +
        "</div>" +
        "<div>" +
        "<p>" + involvedLede + "</p>" +
        '<div class="cta-row">' + involvedCtas + "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</section>" +

        '<section class="cta-banner">' +
        '<div class="container">' +
        "<h2>" + bannerHeading1 + "<br>" + bannerHeading2 + "</h2>" +
        '<div class="cta-row">' + bannerCtas + "</div>" +
        "</div>" +
        "</section>"
    );
}

/* ---- Build: Services -------------------------------------------------- */
function buildBodyServices(rows) {
    var eyebrow = getValue(rows, "hero", "eyebrow");
    var heading = getValue(rows, "hero", "heading");
    var lede = getValue(rows, "hero", "lede");

    var cards = getIndices(rows, "card").map(function (idx) {
        var title = getValue(rows, "card", "title", idx);
        var description = getValue(rows, "card", "description", idx);
        var mediaAlt = getValue(rows, "card", "mediaAlt", idx);
        var ctaLabel = getValue(rows, "card", "ctaLabel", idx);
        var ctaLink = getLink(rows, "card", "ctaLabel", idx);
        return (
            '<div class="column column-25">' +
            '<article class="project-card">' +
            '<div class="card-media">' + mediaAlt + "</div>" +
            '<span class="index-num">' + padIndex(Number(idx)) + "</span>" +
            '<h3 style="font-size: 1.2rem;">' + title + "</h3>" +
            "<p>" + description + "</p>" +
            '<a class="read-more" href="' + ctaLink + '">' + ctaLabel + "</a>" +
            "</article>" +
            "</div>"
        );
    }).join("\n");

    var bannerHeading = getValue(rows, "banner", "heading");
    var bannerCtas = getIndices(rows, "banner").map(function (idx) {
        var label = getValue(rows, "banner", "ctaLabel", idx);
        var link = getLink(rows, "banner", "ctaLabel", idx);
        return '<a class="button button-ghost" href="' + link + '">' + label + "</a>";
    }).join("\n");

    return (
        '<section class="hero" style="padding-bottom: var(--space-6);">' +
        '<div class="container">' +
        '<span class="eyebrow">' + eyebrow + "</span>" +
        '<h1 style="font-size: clamp(2.2rem, 4.4vw, 3.4rem);">' + heading + "</h1>" +
        '<p class="lede" style="max-width: 62ch;">' + lede + "</p>" +
        "</div>" +
        "</section>" +

        "<section>" +
        '<div class="container">' +
        '<div class="row project-grid">' + cards + "</div>" +
        "</div>" +
        "</section>" +

        '<section class="cta-banner">' +
        '<div class="container">' +
        "<h2>" + bannerHeading + "</h2>" +
        '<div class="cta-row">' + bannerCtas + "</div>" +
        "</div>" +
        "</section>"
    );
}

/* ---- Build: Projects (list) -------------------------------------------- */
function buildBodyProjectsList(rows) {
    var eyebrow = getValue(rows, "listHero", "eyebrow");
    var heading = getValue(rows, "listHero", "heading");
    var lede = getValue(rows, "listHero", "lede");

    var cards = parseProjects(rows).map(projectsListCardTemplate).join("\n");

    return (
        '<section class="hero" style="padding-bottom: var(--space-6);">' +
        '<div class="container">' +
        '<span class="eyebrow">' + eyebrow + "</span>" +
        '<h1 style="font-size: clamp(2.2rem, 4.4vw, 3.4rem);">' + heading + "</h1>" +
        '<p class="lede" style="max-width: 62ch;">' + lede + "</p>" +
        "</div>" +
        "</section>" +

        "<section>" +
        '<div class="container">' +
        '<div class="row project-grid">' + cards + "</div>" +
        "</div>" +
        "</section>"
    );
}

/* ---- Build: Project detail (single dynamic template for all projects) - */
function buildBodyProjectDetail(rows, slug) {
    var projects = parseProjects(rows);
    var project = null;
    for (var i = 0; i < projects.length; i++) {
        if (projects[i].slug === slug) { project = projects[i]; break; }
    }

    if (!project) {
        return (
            '<section class="hero" style="padding-bottom: var(--space-6);">' +
            '<div class="container">' +
            '<p class="breadcrumb"><a href="projects.html">Projects</a> / Not found</p>' +
            "<h1>Project not found</h1>" +
            '<p class="lede">We couldn\'t find that project. <a href="projects.html">See all projects →</a></p>' +
            "</div>" +
            "</section>"
        );
    }

    var cards = project.cards.map(function (c) {
        return (
            '<div class="column column-33">' +
            '<article class="project-card">' +
            '<div class="card-media">' + (c.mediaAlt || "") + "</div>" +
            '<h3 style="font-size: 1.3rem;">' + (c.title || "") + "</h3>" +
            "<p>" + (c.description || "") + "</p>" +
            "</article>" +
            "</div>"
        );
    }).join("\n");

    var extraSection = "";
    if (project.thennow) {
        var tn = project.thennow;
        extraSection = (
            '<section class="alt-bg">' +
            '<div class="container">' +
            '<span class="eyebrow">' + (project.thennowEyebrow || "") + "</span>" +
            "<h2>" + (project.thennowHeading || "") + "</h2>" +
            '<div class="row then-now" style="margin-top: var(--space-6);">' +
            '<div class="column column-50"><figure>' +
            '<div class="card-media">' + (tn.then_mediaAlt || "") + "</div>" +
            "<figcaption>" + (tn.then_caption || "") + "</figcaption>" +
            "</figure></div>" +
            '<div class="column column-50"><figure>' +
            '<div class="card-media">' + (tn.now_mediaAlt || "") + "</div>" +
            "<figcaption>" + (tn.now_caption || "") + "</figcaption>" +
            "</figure></div>" +
            "</div>" +
            "</div>" +
            "</section>"
        );
    } else if (project.video) {
        var v = project.video;
        extraSection = (
            '<section class="alt-bg">' +
            '<div class="container">' +
            '<span class="eyebrow">' + (project.videoEyebrow || "") + "</span>" +
            "<h2>" + (project.videoHeading || "") + "</h2>" +
            '<div class="video-embed" style="margin-top: var(--space-6);">' +
            '<iframe src="' + (v.embedUrl || "") + '" title="' + (project.title || "") + ' video feature" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>' +
            "</div>" +
            '<p style="margin-top: var(--space-3);"><a href="' + (v.link || "") + '" target="_blank" rel="noopener">Watch on Vimeo →</a></p>' +
            "</div>" +
            "</section>"
        );
    }

    var ctas = project.ctas.map(function (cta, i) {
        var cls = i === 0 ? "button" : "button button-ghost";
        return '<a class="' + cls + '" href="' + cta.link + '">' + cta.label + "</a>";
    }).join("\n");

    return (
        '<section class="hero" style="padding-bottom: var(--space-6);">' +
        '<div class="container">' +
        '<p class="breadcrumb"><a href="projects.html">Projects</a> / ' + project.title + "</p>" +
        '<span class="eyebrow">' + (project.heroEyebrow || "") + "</span>" +
        '<h1 style="font-size: clamp(2.2rem, 4.4vw, 3.4rem);">' + project.title + "</h1>" +
        '<p class="lede" style="max-width: 62ch;">' + (project.heroDescription || "") + "</p>" +
        "</div>" +
        "</section>" +

        "<section>" +
        '<div class="container">' +
        '<div class="row project-grid">' + cards + "</div>" +
        "</div>" +
        "</section>" +

        extraSection +

        "<section>" +
        '<div class="container">' +
        '<div class="cta-row">' + ctas + "</div>" +
        "</div>" +
        "</section>"
    );
}

/* ---- Build: About Us ---------------------------------------------------- */
function buildBodyAboutUs(rows) {
    var heroEyebrow = getValue(rows, "hero", "eyebrow");
    var heroHeading = getValue(rows, "hero", "heading");
    var heroLede = getValue(rows, "hero", "lede");

    var teamEyebrow = getValue(rows, "teamIntro", "eyebrow");
    var teamHeading = getValue(rows, "teamIntro", "heading");
    var teamMembers = getIndices(rows, "team").map(function (idx) {
        var name = getValue(rows, "team", "name", idx);
        var role = getValue(rows, "team", "role", idx);
        return personCardTemplate(name, role);
    }).join("\n");

    var boardEyebrow = getValue(rows, "boardIntro", "eyebrow");
    var boardHeading = getValue(rows, "boardIntro", "heading");
    var boardMembers = getIndices(rows, "board").map(function (idx) {
        var name = getValue(rows, "board", "name", idx);
        var role = getValue(rows, "board", "role", idx);
        return personCardTemplate(name, role);
    }).join("\n");

    var sponsorsEyebrow = getValue(rows, "sponsorsIntro", "eyebrow");
    var sponsorsHeading = getValue(rows, "sponsorsIntro", "heading");
    var sponsorsLede = getValue(rows, "sponsorsIntro", "lede");
    var sponsors = getIndices(rows, "sponsor").map(function (idx) {
        var name = getValue(rows, "sponsor", "name", idx);
        return '<div class="logo-placeholder">' + name + "</div>";
    }).join("\n");

    return (
        '<section class="hero" style="padding-bottom: var(--space-6);">' +
        '<div class="container">' +
        '<span class="eyebrow">' + heroEyebrow + "</span>" +
        '<h1 style="font-size: clamp(2.2rem, 4.4vw, 3.4rem);">' + heroHeading + "</h1>" +
        '<p class="lede" style="max-width: 62ch;">' + heroLede + "</p>" +
        "</div>" +
        "</section>" +

        "<section>" +
        '<div class="container">' +
        '<span class="eyebrow">' + teamEyebrow + "</span>" +
        "<h2>" + teamHeading + "</h2>" +
        '<div class="row" style="margin-top: var(--space-8); border-top: 2px solid var(--color-divider); padding-top: var(--space-8);">' + teamMembers + "</div>" +
        "</div>" +
        "</section>" +

        '<section class="alt-bg">' +
        '<div class="container">' +
        '<span class="eyebrow">' + boardEyebrow + "</span>" +
        "<h2>" + boardHeading + "</h2>" +
        '<div class="row" style="margin-top: var(--space-8); border-top: 2px solid var(--color-divider); padding-top: var(--space-8);">' + boardMembers + "</div>" +
        "</div>" +
        "</section>" +

        "<section>" +
        '<div class="container">' +
        '<span class="eyebrow">' + sponsorsEyebrow + "</span>" +
        "<h2>" + sponsorsHeading + "</h2>" +
        '<p style="color: var(--color-text-soft); margin-top: var(--space-4);">' + sponsorsLede + "</p>" +
        '<div class="logo-row" style="margin-top: var(--space-6);">' + sponsors + "</div>" +
        "</div>" +
        "</section>"
    );
}

function personCardTemplate(name, role) {
    var initial = name ? name.charAt(0).toUpperCase() : "";
    return (
        '<div class="column column-25">' +
        '<div class="person-card">' +
        '<div class="person-avatar">' + initial + "</div>" +
        '<h3 style="font-size: 1.15rem;">' + name + "</h3>" +
        '<p class="person-role">' + role + "</p>" +
        "</div>" +
        "</div>"
    );
}

/* ---- Build: Media & News -------------------------------------------- */
function buildBodyNews(rows) {
    var eyebrow = getValue(rows, "hero", "eyebrow");
    var heading = getValue(rows, "hero", "heading");
    var lede = getValue(rows, "hero", "lede");

    var items = getIndices(rows, "media").map(function (idx) {
        var itemEyebrow = getValue(rows, "media", "eyebrow", idx);
        var title = getValue(rows, "media", "title", idx);
        var description = getValue(rows, "media", "description", idx);
        var quote = getValue(rows, "media", "quote", idx);
        var embedUrl = getValue(rows, "media", "embedUrl", idx);
        var ctaLabel = getValue(rows, "media", "ctaLabel", idx);
        var ctaLink = getLink(rows, "media", "ctaLabel", idx) || getValue(rows, "media", "link", idx);
        ctaLink = normalizeLink(ctaLink);

        var body = "";
        if (embedUrl) {
            body = (
                '<div class="video-embed" style="margin-top: var(--space-4);">' +
                '<iframe src="' + embedUrl + '" title="' + title + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>' +
                "</div>"
            );
        } else if (quote) {
            body = '<blockquote style="margin-top: var(--space-3); padding-left: var(--space-4);">' + quote + "</blockquote>";
        } else if (description) {
            body = '<p style="color: var(--color-text-soft); margin-top: var(--space-3);">' + description + "</p>";
        }

        var ctaHtml = ctaLink
            ? '<p style="margin-top: var(--space-3);"><a href="' + ctaLink + '" target="_blank" rel="noopener">' + ctaLabel + "</a></p>"
            : '<p style="margin-top: var(--space-3);"><a href="#" aria-disabled="true">' + ctaLabel + "</a></p>";

        return (
            '<article class="media-item" style="border-top: 2px solid var(--color-divider); padding-top: var(--space-6);">' +
            '<span class="eyebrow">' + itemEyebrow + "</span>" +
            '<h2 style="font-size: 1.6rem;">' + title + "</h2>" +
            body +
            ctaHtml +
            "</article>"
        );
    }).join("\n");

    return (
        '<section class="hero" style="padding-bottom: var(--space-6);">' +
        '<div class="container">' +
        '<span class="eyebrow">' + eyebrow + "</span>" +
        '<h1 style="font-size: clamp(2.2rem, 4.4vw, 3.4rem);">' + heading + "</h1>" +
        '<p class="lede" style="max-width: 62ch;">' + lede + "</p>" +
        "</div>" +
        "</section>" +

        "<section>" +
        '<div class="container">' +
        items +
        "</div>" +
        "</section>"
    );
}

// Render Pages Dynamically
function initPageData (data) {

    let pageBody = document.querySelector("[dynamic-body]");
    if (!pageBody) return; // no dynamic content on this page
    let pageId = pageBody.id;
    let bodyContent = 'Loading Content...';

    if (pageId === "gallery") {
        // Gallery renders its grid via live DOM updates + filter click
        // handlers (not a one-shot HTML string), so it fills in the static
        // shell first, then lets initGallery populate/wire it up.
        pageBody.innerHTML = buildBodyGallery();
        initGallery(data);
        return;
    }
    if (pageId === "home") {
        bodyContent = buildBodyHome(data.website_home || [], data.website_projects || []);
    }
    if (pageId === "services") {
        bodyContent = buildBodyServices(data.website_services || []);
    }
    if (pageId === "projects") {
        bodyContent = buildBodyProjectsList(data.website_projects || []);
    }
    if (pageId === "project-detail") {
        var params = new URLSearchParams(window.location.search);
        var slug = params.get("slug");
        bodyContent = buildBodyProjectDetail(data.website_projects || [], slug);
    }
    if (pageId === "news") {
        bodyContent = buildBodyNews(data.website_news || []);
    }
    if (pageId === "aboutus") {
        bodyContent = buildBodyAboutUs(data.website_aboutus || []);
    }
    if (pageId === "contact") {
        bodyContent = buildBodyContact(data.website_contact, pageBody);
    }

    pageBody.innerHTML = bodyContent;
}

// Get Data from Google Drive Feed
async function getData() {
    const url = 'https://script.google.com/macros/s/AKfycbz-iHoxllIXcAyS_4pGWyNu99TCaj-Bi_Daoc6zsmDFTMJfUN4Z-XsBbFRMwAaJhUQ/exec';
    const data = await fetch(url)
        .then(function (res) {
            if (!res.ok) throw new Error("Google Feed Request Failed.");
            return res.json();
        })
        .catch(function (err) {
            console.warn("JSON Feed Mapping Failing, Review Fetch:", err);
        });
    
    return data;
}

// Generate Elements on Page Load
window.onload = async () => {
    // Get Site Data
    let siteData = await getData();
    initNavMenu(siteData);
    initFooter(siteData);
    initFooterYear();
    initPageData(siteData);

};

