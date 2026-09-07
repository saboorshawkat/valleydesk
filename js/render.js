/* Valley Desk — home page (index.html) renderer.
   Fetches jobs.json, admitcards.json, and results.json, fills the
   theme's three sections, keeps the Browse-by-Category counts in sync
   with the real data, and caps each home section to 10 cards — with a
   "View All" link to the dedicated jobs.html / results.html /
   admitcards.html pages (which paginate the full list) once a section
   has more than that. Shared helpers (CATEGORY_META, card builders,
   theme/clock/etc.) live in common.js, loaded before this file. */

const HOME_SECTION_LIMIT = 10;

/* ---------- JOBS (#jobsContainer) ---------- */

async function loadJobs() {
  try {
    const res = await fetch("jobs.json?_=" + Date.now());
    const jobs = await res.json();
    renderJobs(jobs);
    updateCategoryGridCounts(jobs);
  } catch (e) {
    console.error("Could not load jobs.json", e);
  }
}

/* Creates (once) a dedicated slot inside the theme's ".wrap" — the element
   that actually carries the page's padding/max-width — right before
   #noResults. Every refresh overwrites this one slot instead of inserting
   a fresh copy, so nothing stacks up or drifts the layout. */
function getJobsSlot() {
  let slot = document.getElementById("dynamicJobsList");
  if (slot) return slot;

  const wrap = document.querySelector("#jobsContainer .wrap");
  if (!wrap) return null;

  slot = document.createElement("div");
  slot.id = "dynamicJobsList";

  const noResults = document.getElementById("noResults");
  if (noResults) wrap.insertBefore(slot, noResults);
  else wrap.appendChild(slot);
  return slot;
}

function renderJobs(jobs) {
  const slot = getJobsSlot();
  if (!slot) return;

  const byCat = {};
  jobs.forEach((j) => (byCat[j.category] = byCat[j.category] || []).push(j));

  // Preserve the curated CATEGORY_META order first, then append any
  // category the data introduces that isn't in that list yet.
  const catOrder = Object.keys(CATEGORY_META).concat(
    Object.keys(byCat).filter((c) => !CATEGORY_META[c])
  );

  let html = "";
  let anyJobs = false;
  let shown = 0;
  const totalJobs = jobs.length;

  catOrder.forEach((catKey) => {
    if (shown >= HOME_SECTION_LIMIT) return;
    const catJobs = byCat[catKey];
    if (!catJobs || !catJobs.length) return;
    anyJobs = true;
    const meta = categoryMetaFor(catKey);
    const room = HOME_SECTION_LIMIT - shown;
    const slice = catJobs.slice(0, room);
    shown += slice.length;
    html += `
      <div class="cat-section-hd" data-section="${catKey}" style="background:${meta.color}29;border:1px solid ${meta.color}66;border-left-color:${meta.color};box-shadow:0 3px 12px ${meta.color}2e">
        <div class="csh-icon">${meta.icon}</div>
        <div class="csh-info"><div class="csh-title">${meta.title}</div><div class="csh-desc">${meta.desc}</div></div>
        <div class="csh-count" style="color:${meta.color}">${catJobs.length} Jobs</div>
      </div>
      <div class="tools-list">${slice.map(buildJobCard).join("")}</div>`;
  });

  if (totalJobs > HOME_SECTION_LIMIT) {
    html += `
      <div class="view-all-wrap">
        <a class="view-all-btn" href="jobs.html"><i class="fa fa-layer-group"></i> View All ${totalJobs} Jobs</a>
      </div>`;
  }

  slot.innerHTML = html;

  const noResults = document.getElementById("noResults");
  if (noResults) noResults.style.display = anyJobs ? "none" : "block";
}

/* Keeps the "Browse by Category" grid's counts (cgc-count) synced to the
   real job counts instead of the static numbers baked into the HTML. */
function updateCategoryGridCounts(jobs) {
  const counts = {};
  jobs.forEach((j) => (counts[j.category] = (counts[j.category] || 0) + 1));

  document.querySelectorAll(".cat-grid-card").forEach((card) => {
    const onclick = card.getAttribute("onclick") || "";
    const m = onclick.match(/filterCat\('([^']+)'/);
    if (!m) return;
    const cat = m[1];
    const countEl = card.querySelector(".cgc-count");
    if (countEl) countEl.textContent = `${counts[cat] || 0} Jobs`;
  });

  const sections = new Set(jobs.map((j) => j.category)).size;

  const chip = document.querySelector(".cgs-chip");
  if (chip) chip.textContent = `${sections} Sections`;

  // Masthead stats ("Jobs Listed" / "Categories") reflect the real data
  // instead of the numbers baked into the HTML.
  const jobsListedEl = document.getElementById("statJobsListed");
  if (jobsListedEl) jobsListedEl.textContent = jobs.length;
  const categoriesEl = document.getElementById("statCategories");
  if (categoriesEl) categoriesEl.textContent = sections;
}

/* ---------- ADMIT CARDS (#admitCardSection) ---------- */

async function loadAdmitCards() {
  try {
    const res = await fetch("admitcards.json?_=" + Date.now());
    const cards = await res.json();
    renderAdmitCards(cards);
  } catch (e) {
    console.error("Could not load admitcards.json", e);
  }
}

function renderAdmitCards(cards) {
  const list = document.getElementById("admitCardList");
  const count = document.getElementById("admitCardCount");
  if (!list) return;
  const shown = cards.slice(0, HOME_SECTION_LIMIT);
  list.innerHTML = shown.map(buildAdmitCard).join("");
  if (cards.length > HOME_SECTION_LIMIT) {
    list.innerHTML += `
      <div class="view-all-wrap">
        <a class="view-all-btn" href="admitcards.html"><i class="fa fa-id-card-clip"></i> View All ${cards.length} Admit Cards</a>
      </div>`;
  }
  if (count) count.textContent = `${cards.length} Released`;
}

/* ---------- RESULTS (#resultSection) ---------- */

async function loadResults() {
  try {
    const res = await fetch("results.json?_=" + Date.now());
    const results = await res.json();
    renderResults(results);
  } catch (e) {
    console.error("Could not load results.json", e);
  }
}

function renderResults(results) {
  const list = document.getElementById("resultList");
  const count = document.getElementById("resultCount");
  if (!list) return;
  const shown = results.slice(0, HOME_SECTION_LIMIT);
  list.innerHTML = shown.map(buildResultCard).join("");
  if (results.length > HOME_SECTION_LIMIT) {
    list.innerHTML += `
      <div class="view-all-wrap">
        <a class="view-all-btn" href="results.html"><i class="fa fa-trophy"></i> View All ${results.length} Results</a>
      </div>`;
  }
  if (count) count.textContent = `${results.length} Declared`;
}

/* ---------- Category strip / search (homepage-only interactions) ---------- */

/* Used by every homepage element that jumps to a category (hero quicklinks,
   the "Browse by Category" grid, footer category links, mobile nav) instead
   of calling filterCat() directly with a hand-picked element. Looks up the
   matching #catStrip button for `cat` so the correct pill gets highlighted,
   instead of always highlighting whichever button happened to be passed in. */
function jumpToCat(cat, clickedEl) {
  if (!clickedEl) {
    const strip = document.getElementById("catStrip");
    if (strip) clickedEl = strip.querySelector(`.cs-btn[data-cat="${cat}"]`);
  }
  filterCat(cat, clickedEl);
}

function filterCat(cat, clickedEl) {
  document.querySelectorAll(".cs-btn").forEach(function (b) {
    b.classList.remove("act");
  });
  if (clickedEl) clickedEl.classList.add("act");

  const allCards = document.querySelectorAll(".tool-card[data-cat]");
  let anyVisible = false;
  allCards.forEach(function (card) {
    if (cat === "all" || card.getAttribute("data-cat") === cat) {
      card.style.display = "";
      anyVisible = true;
    } else {
      card.style.display = "none";
    }
  });

  document.querySelectorAll(".cat-section-hd").forEach(function (hd) {
    const sec = hd.getAttribute("data-section");
    hd.style.display = cat === "all" || cat === sec ? "" : "none";
  });

  const noResults = document.getElementById("noResults");
  if (noResults) noResults.style.display = anyVisible ? "none" : "block";
  const jc = document.getElementById("jobsContainer");
  if (jc) jc.scrollIntoView({ behavior: "smooth" });
}

function liveSearch(q) {
  q = q.toLowerCase().trim();
  const allCards = document.querySelectorAll(".tool-card[data-cat]");
  let anyVisible = false;
  allCards.forEach(function (card) {
    const name = (card.getAttribute("data-name") || "").toLowerCase();
    const desc = (card.querySelector(".tc-desc") || { innerText: "" }).innerText.toLowerCase();
    const match = !q || name.includes(q) || desc.includes(q);
    card.style.display = match ? "" : "none";
    if (match) anyVisible = true;
  });
  document.querySelectorAll(".cat-section-hd").forEach(function (el) {
    el.style.display = q ? "none" : "";
  });
  const noResults = document.getElementById("noResults");
  if (noResults) noResults.style.display = anyVisible ? "none" : "block";
}

document.addEventListener("DOMContentLoaded", function () {
  const heroSearch = document.getElementById("heroSearch");
  const navSearch = document.querySelector(".nsearch input");
  if (heroSearch) {
    heroSearch.addEventListener("input", function () {
      liveSearch(this.value);
      if (navSearch) navSearch.value = this.value;
    });
  }
  if (navSearch) {
    navSearch.addEventListener("input", function () {
      liveSearch(this.value);
      if (heroSearch) heroSearch.value = this.value;
    });
  }
});

/* ---------- Boot + periodic refresh ---------- */

function loadAll() {
  loadJobs();
  loadAdmitCards();
  loadResults();
}

document.addEventListener("DOMContentLoaded", loadAll);
// Re-check for freshly scraped content every 15 minutes without a page reload
setInterval(loadAll, 15 * 60 * 1000);
