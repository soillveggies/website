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
        <section class="hero" style="padding-bottom: var(--space-6);">
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

// Render Pages Dynamically
function initPageData (data) {

    let pageBody = document.querySelector("[dynamic-body]");
    let pageId = pageBody.id;
    let bodyContent = 'Loading Content...';

    if (pageId === "home") {

    }
    if (pageId === "services") {
        
    }
    if (pageId === "projects") {
        
    }
    if (pageId === "gallery") {
        
    }
    if (pageId === "news") {
        
    }
    if (pageId === "aboutus") {
        
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
    initFooterYear();
    initPageData(siteData);
    initGallery(siteData);

};

