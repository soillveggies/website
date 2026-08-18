/* ==========================================================================
   So ILL Veggies — shared site behavior
   Vanilla JS only (no build step / no server), per project requirements.
   ========================================================================== */



/* ---- Mobile nav toggle ------------------------------------------- */
function initNavToggle() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".main-nav");
    if (!toggle || !nav) return;

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

/* ---- Footer year --------------------------------------------------- */
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
    initNavToggle();
    initFooterYear();
    initGallery(siteData);

};

