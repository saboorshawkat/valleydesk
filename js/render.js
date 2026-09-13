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

let _hashJumpDone = false;

async function loadJobs() {
  try {
    const res = await fetch("jobs.json?_=" + Date.now());
    const jobs = await res.json();
    renderJobs(jobs);
    updateCategoryGridCounts(jobs);
    /* Deep link from the off-canvas menu / other pages, e.g. jobs.json
       finished rendering and the URL says index.html#jkssb — filter to
       that category once, the first time jobs load. */
    if (!_hashJumpDone && location.hash) {
      _hashJumpDone = true;
      jumpToCat(location.hash.slice(1));
    }
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

/* ---------- EXAMS (#examSection) ---------- */

async function loadExams() {
  try {
    const res = await fetch("exams.json?_=" + Date.now());
    const exams = await res.json();
    renderExams(exams);
  } catch (e) {
    console.error("Could not load exams.json", e);
  }
}

function renderExams(exams) {
  const list = document.getElementById("examList");
  const count = document.getElementById("examCount");
  if (!list) return;
  const shown = exams.slice(0, HOME_SECTION_LIMIT);
  list.innerHTML = shown.map(buildExamCard).join("");
  if (exams.length > HOME_SECTION_LIMIT) {
    list.innerHTML += `
      <div class="view-all-wrap">
        <a class="view-all-btn" href="exams.html"><i class="fa fa-pen-to-square"></i> View All ${exams.length} Exams</a>
      </div>`;
  }
  if (count) count.textContent = `${exams.length} Listed`;
  return exams;
}

/* ---------- ADMISSIONS (#admissionSection) ---------- */

async function loadAdmissions() {
  try {
    const res = await fetch("admissions.json?_=" + Date.now());
    const admissions = await res.json();
    renderAdmissions(admissions);
    return admissions;
  } catch (e) {
    console.error("Could not load admissions.json", e);
    return [];
  }
}

function renderAdmissions(admissions) {
  const list = document.getElementById("admissionList");
  const count = document.getElementById("admissionCount");
  if (!list) return;
  const shown = admissions.slice(0, HOME_SECTION_LIMIT);
  list.innerHTML = shown.map(buildAdmissionCard).join("");
  if (admissions.length > HOME_SECTION_LIMIT) {
    list.innerHTML += `
      <div class="view-all-wrap">
        <a class="view-all-btn" href="admissions.html"><i class="fa fa-graduation-cap"></i> View All ${admissions.length} Admissions</a>
      </div>`;
  }
  if (count) count.textContent = `${admissions.length} Open`;
}

/* ---------- SCHOLARSHIPS (#scholarshipSection) ---------- */

async function loadScholarships() {
  try {
    const res = await fetch("scholarships.json?_=" + Date.now());
    const scholarships = await res.json();
    renderScholarships(scholarships);
  } catch (e) {
    console.error("Could not load scholarships.json", e);
  }
}

function renderScholarships(scholarships) {
  const list = document.getElementById("scholarshipList");
  const count = document.getElementById("scholarshipCount");
  if (!list) return;
  const shown = scholarships.slice(0, HOME_SECTION_LIMIT);
  list.innerHTML = shown.map(buildScholarshipCard).join("");
  if (scholarships.length > HOME_SECTION_LIMIT) {
    list.innerHTML += `
      <div class="view-all-wrap">
        <a class="view-all-btn" href="scholarships.html"><i class="fa fa-coins"></i> View All ${scholarships.length} Scholarships</a>
      </div>`;
  }
  if (count) count.textContent = `${scholarships.length} Open`;
}

/* ---------- CLOSING SOON (#closingSoonSection) ----------
   Pulls the "lastDate" (application deadline) off jobs, exams and
   admissions, keeps whatever is due to close within the next 7 days,
   and lists it soonest-first — the auto-generated dashboard strip the
   ValleyDesk notification-hub concept calls for, computed straight
   from the same JSON the individual sections already use so there's
   nothing extra to keep in sync by hand. */

const CLOSING_SOON_WINDOW_DAYS = 7;

function collectClosingSoon(jobs, exams, admissions) {
  const pool = [
    ...jobs.map((j) => ({ ...j, _kind: "Job", _icon: "fa-briefcase", _link: j.applyLink })),
    ...exams.map((e) => ({ ...e, _kind: "Exam", _icon: "fa-pen-to-square", _link: e.applyLink })),
    ...admissions.map((a) => ({ ...a, _kind: "Admission", _icon: "fa-graduation-cap", _link: a.applyLink })),
  ];

  return pool
    .map((item) => ({ item, days: daysUntil(item.lastDate) }))
    .filter((x) => x.days !== null && x.days >= 0 && x.days <= CLOSING_SOON_WINDOW_DAYS)
    .sort((a, b) => a.days - b.days);
}

function buildClosingSoonRow({ item, days }) {
  const dayLabel = days === 0 ? "Closes Today" : days === 1 ? "1 Day Left" : `${days} Days Left`;
  const cls = days <= 2 ? "tcb-r" : "tcb-y";
  return `
    <div class="tool-card" data-name="${escapeAttr(item.name)}">
      <div class="tc-body">
        <div class="tc-top">
          <div class="tc-name-wrap">
            <div class="tc-name"><i class="fa-solid ${item._icon}" style="font-size:9px;margin-right:5px;color:var(--t3)"></i>${item.name}</div>
            <div class="tc-ver">${item._kind} · ${item.subtitle || ""}</div>
          </div>
          <div class="tc-badges"><span class="tcb ${cls}">${dayLabel}</span></div>
        </div>
        <div class="tc-foot">
          <div class="tc-dates"><span class="tc-date tc-date-reg"><i class="fa fa-calendar-xmark"></i> Last Date: ${item.lastDate}</span></div>
          <div class="tc-actions">
            <a href="${item._link || item.officialLink || "#"}" class="tc-btn tc-btn-g" target="_blank"><i class="fa fa-paper-plane"></i> Apply Now</a>
          </div>
        </div>
      </div>
    </div>`;
}

async function loadClosingSoon(jobs, exams, admissions) {
  const wrap = document.getElementById("closingSoonSection");
  const list = document.getElementById("closingSoonList");
  const count = document.getElementById("closingSoonCount");
  if (!wrap || !list) return;

  const closing = collectClosingSoon(jobs || [], exams || [], admissions || []);
  if (!closing.length) {
    wrap.style.display = "none";
    return;
  }
  wrap.style.display = "";
  list.innerHTML = closing.map(buildClosingSoonRow).join("");
  if (count) count.textContent = `${closing.length} Closing`;
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

async function fetchJson(path) {
  try {
    const res = await fetch(path + "?_=" + Date.now());
    return await res.json();
  } catch (e) {
    console.error("Could not load " + path, e);
    return [];
  }
}

async function loadAll() {
  loadJobs();
  loadAdmitCards();
  loadResults();
  loadScholarships();

  // Exams and admissions feed both their own homepage sections *and* the
  // Closing Soon strip, so fetch them once here and reuse the data instead
  // of hitting exams.json / admissions.json twice.
  const [jobs, exams, admissions] = await Promise.all([
    fetchJson("jobs.json"),
    fetchJson("exams.json"),
    fetchJson("admissions.json"),
  ]);
  renderExams(exams);
  renderAdmissions(admissions);
  loadClosingSoon(jobs, exams, admissions);
}

document.addEventListener("DOMContentLoaded", loadAll);
// Re-check for freshly scraped content every 15 minutes without a page reload
setInterval(loadAll, 15 * 60 * 1000);
