/* ==========================================================================
   So ILL Veggies — shared site behavior
   Vanilla JS only (no build step / no server), per project requirements.
   ========================================================================== */

(function () {
  "use strict";

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

  /* ---- Gallery: load from data/gallery.json and filter by category --
     NOTE: This reads a local JSON placeholder. To pull real images from a
     public Google Drive folder, replace loadGalleryData() with a fetch to
     your published Drive/Apps Script JSON endpoint that returns the same
     shape: [{ "title": "", "category": "", "alt": "" }, ...] */
  function loadGalleryData() {
    return fetch("data/gallery.json")
      .then(function (res) {
        if (!res.ok) throw new Error("gallery.json not found");
        return res.json();
      })
      .catch(function () {
        return [];
      });
  }

  function renderGallery(items, activeFilter) {
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
      media.textContent = item.alt || item.title || "Photo placeholder";
      var caption = document.createElement("figcaption");
      caption.textContent = item.title || "";
      figure.appendChild(media);
      figure.appendChild(caption);
      column.appendChild(figure);
      grid.appendChild(column);
    });
  }

  function initGallery() {
    var grid = document.querySelector("[data-gallery-grid]");
    if (!grid) return; // not on gallery page

    var filterButtons = document.querySelectorAll(".filter-btn");
    var currentFilter = "all";

    loadGalleryData().then(function (items) {
      renderGallery(items, currentFilter);

      filterButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          filterButtons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
          btn.setAttribute("aria-pressed", "true");
          currentFilter = btn.getAttribute("data-filter");
          renderGallery(items, currentFilter);
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNavToggle();
    initFooterYear();
    initGallery();
  });
})();
