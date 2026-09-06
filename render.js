/* Valley Desk — dynamic content renderer
   Reads jobs.json (the only feed the scraper produces) and splits every
   entry into exactly ONE of three buckets — Job Listing, Admit Card, or
   Result — based on what the post is actually about. Nothing else is
   ever shown: no placeholder/demo rows, no rows missing a real title
   (the old "undefined" bug), no duplicate scrapes. Category job-counts,
   the "Browse by Category" numbers and the header's "Updated" tag are
   all recomputed from this same data so the numbers never drift out of
   sync with what's actually on the page. */

const CATEGORY_META = {
  jkssb:        { icon: "📋", title: "JKSSB Recruitment",       desc: "J&K Services Selection Board",              color: "#0ac16c" },
  jkpsc:        { icon: "⚖️", title: "JKPSC Recruitment",       desc: "Jammu & Kashmir Public Service Commission", color: "#34d399" },
  jkpolice:     { icon: "👮", title: "JK Police Recruitment",   desc: "Jammu & Kashmir Police Department",         color: "#ff7f50" },
  jkbank:       { icon: "🏦", title: "J&K Bank Recruitment",    desc: "Jammu & Kashmir Bank Ltd",                  color: "#f5c518" },
  jkjudiciary:  { icon: "🏛️", title: "JK Judiciary Recruitment", desc: "J&K High Court & District Courts",         color: "#38bdf8" },
  jkteaching:   { icon: "📘", title: "JK Teaching Recruitment", desc: "School Education Department, J&K",          color: "#25d366" },
  jkhealth:     { icon: "🩺", title: "JK Health Dept Recruitment", desc: "SKIMS, GMC & Directorate of Health Services", color: "#fb923c" },
  jkuniversity: { icon: "🎓", title: "JK University Recruitment", desc: "University of Kashmir & University of Jammu", color: "#e879f9" },
};

// Only posts matching one of these belong in Admit Card / Result.
// Everything else that still has a valid title stays a plain Job Listing.
const ADMIT_CARD_RE = /admit\s*card|hall\s*ticket|call\s*letter/i;
const RESULT_RE = /\bresults?\b|merit\s*list|selection\s*list|declared/i;

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;").toLowerCase();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/* ---------- Load, validate, classify ---------- */

async function loadJobs() {
  try {
    const res = await fetch("jobs.json?_=" + Date.now());
    const raw = await res.json();
    const { jobs, admitCards, results } = processFeed(raw);
    renderJobs(jobs);
    renderAdmitCards(admitCards);
    renderResults(results);
    updateHeaderStats(jobs, admitCards, results);
  } catch (e) {
    console.error("Could not load jobs.json", e);
  }
}

/* Normalizes a raw feed entry into a clean post object, or returns null
   if the entry has no real title — this is what previously showed up
   as a literal "undefined" post on the page. Only entries with a
   proper name AND a known category are kept, so nothing unrecognized
   or half-formed ever reaches the page. */
function normalizePost(raw) {
  const name = (raw && raw.name ? String(raw.name) : "").trim();
  if (!name) return null;
  if (!raw.category || !CATEGORY_META[raw.category]) return null;

  return {
    id: raw.id || null,
    category: raw.category,
    name,
    subtitle: (raw.subtitle || "").trim(),
    desc: (raw.desc || `${name} — posted by ${raw.subtitle || "the department"}.`).trim(),
    badges: Array.isArray(raw.badges) ? raw.badges : [],
    lastDate: raw.lastDate || "--/--/----",
    applyLink: raw.applyLink || "#",
    notificationLink: raw.notificationLink || "#",
    officialLink: raw.officialLink || "#",
    scrapedAt: raw.scrapedAt || null,
  };
}

function classify(post) {
  const text = `${post.name} ${post.desc}`;
  if (ADMIT_CARD_RE.test(text)) return "admitcard";
  if (RESULT_RE.test(text)) return "result";
  return "job";
}

/* Splits the raw feed into jobs / admitCards / results, dropping
   invalid rows and de-duplicating repeated scrapes of the same post
   (the feed sometimes contains the exact same posting more than once). */
function processFeed(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const seen = new Set();
  const jobs = [], admitCards = [], results = [];

  list.forEach((entry) => {
    const post = normalizePost(entry);
    if (!post) return; // no real title — never shown, anywhere

    const dedupeKey = `${post.category}|${post.name}|${post.notificationLink}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const bucket = classify(post);
    if (bucket === "admitcard") admitCards.push(post);
    else if (bucket === "result") results.push(post);
    else jobs.push(post);
  });

  const byRecency = (a, b) => new Date(b.scrapedAt || 0) - new Date(a.scrapedAt || 0);
  admitCards.sort(byRecency);
  results.sort(byRecency);

  return { jobs, admitCards, results };
}

/* ---------- JOBS (#jobsContainer) ---------- */

function buildJobCard(job) {
  const badges = job.badges.map((b) => `<span class="tcb ${b.cls}">${b.label}</span>`).join("");
  return `
    <div class="tool-card" data-cat="${job.category}" data-name="${escapeAttr(job.name)}">
      <div class="tc-body">
        <div class="tc-top">
          <div class="tc-name-wrap">
            <div class="tc-name">${escapeHtml(job.name)}</div>
            <div class="tc-ver">${escapeHtml(job.subtitle)}</div>
          </div>
          <div class="tc-badges">${badges}</div>
        </div>
        <div class="tc-desc">${escapeHtml(job.desc)}</div>
        <div class="tc-foot">
          <div class="tc-dates"><span class="tc-date tc-date-reg"><i class="fa fa-calendar-xmark"></i> Last Date Of Applying: ${job.lastDate}</span></div>
          <div class="tc-actions">
            <a href="${job.applyLink}" class="tc-btn tc-btn-g" target="_blank"><i class="fa fa-paper-plane"></i> Apply Now</a>
            <a href="${job.notificationLink}" class="tc-btn tc-btn-b" target="_blank"><i class="fa fa-file-pdf"></i> Notification</a>
            <a href="${job.officialLink}" class="tc-btn tc-btn-o" target="_blank"><i class="fa fa-globe"></i> Official Website</a>
          </div>
        </div>
      </div>
    </div>`;
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

  let html = "";
  let anyJobs = false;

  Object.keys(CATEGORY_META).forEach((catKey) => {
    const catJobs = byCat[catKey];
    updateCategoryGridCount(catKey, catJobs ? catJobs.length : 0);
    if (!catJobs || !catJobs.length) return;
    anyJobs = true;
    const meta = CATEGORY_META[catKey];
    html += `
      <div class="cat-section-hd" data-section="${catKey}" style="background:${meta.color}29;border:1px solid ${meta.color}66;border-left-color:${meta.color};box-shadow:0 3px 12px ${meta.color}2e">
        <div class="csh-icon">${meta.icon}</div>
        <div class="csh-info"><div class="csh-title">${meta.title}</div><div class="csh-desc">${meta.desc}</div></div>
        <div class="csh-count" style="color:${meta.color}">${catJobs.length} Job${catJobs.length === 1 ? "" : "s"}</div>
      </div>
      <div class="tools-list">${catJobs.map(buildJobCard).join("")}</div>`;
  });

  slot.innerHTML = html;

  const noResults = document.getElementById("noResults");
  if (noResults) noResults.style.display = anyJobs ? "none" : "block";
}

/* Keeps the "Browse by Category" grid counts (cgcCount-<cat>) in sync
   with the real number of job listings in each category. */
function updateCategoryGridCount(catKey, count) {
  const el = document.getElementById(`cgcCount-${catKey}`);
  if (el) el.textContent = `${count} Job${count === 1 ? "" : "s"}`;
}

/* ---------- ADMIT CARDS (#admitCardSection) ---------- */

function buildAdmitCard(item) {
  const badges = item.badges.map((b) => `<span class="tcb ${b.cls}">${b.label}</span>`).join("");
  const added = formatDate(item.scrapedAt);
  return `
    <div class="tool-card" data-cat="${item.category}" data-name="${escapeAttr(item.name)}">
      <div class="tc-body">
        <div class="tc-top">
          <div class="tc-name-wrap"><div class="tc-name">${escapeHtml(item.name)}</div><div class="tc-ver">${escapeHtml(item.subtitle)}</div></div>
          <div class="tc-badges">${badges}<span class="tcb tcb-g">Released</span></div>
        </div>
        <div class="tc-desc">${escapeHtml(item.desc)}</div>
        <div class="tc-foot">
          <div class="tc-dates">${added ? `<span class="tc-date tc-date-start"><i class="fa fa-calendar-plus"></i> Added: ${added}</span>` : ""}<span class="tc-date tc-date-reg"><i class="fa fa-calendar-check"></i> Notification Date: ${item.lastDate}</span></div>
          <div class="tc-actions">
            <a href="${item.notificationLink}" class="tc-btn tc-btn-g" target="_blank"><i class="fa fa-download"></i> Download Admit Card</a>
            <a href="${item.officialLink}" class="tc-btn tc-btn-o" target="_blank"><i class="fa fa-globe"></i> Official Website</a>
          </div>
        </div>
      </div>
    </div>`;
}

function renderAdmitCards(cards) {
  const list = document.getElementById("admitCardList");
  const count = document.getElementById("admitCardCount");
  const empty = document.getElementById("noAdmitCards");
  if (!list) return;
  list.innerHTML = cards.map(buildAdmitCard).join("");
  if (count) count.textContent = `${cards.length} Released`;
  if (empty) empty.style.display = cards.length ? "none" : "block";
}

/* ---------- RESULTS (#resultSection) ---------- */

function buildResultCard(item) {
  const badges = item.badges.map((b) => `<span class="tcb ${b.cls}">${b.label}</span>`).join("");
  const added = formatDate(item.scrapedAt);
  return `
    <div class="tool-card" data-cat="${item.category}" data-name="${escapeAttr(item.name)}">
      <div class="tc-body">
        <div class="tc-top">
          <div class="tc-name-wrap"><div class="tc-name">${escapeHtml(item.name)}</div><div class="tc-ver">${escapeHtml(item.subtitle)}</div></div>
          <div class="tc-badges">${badges}<span class="tcb tcb-g">Declared</span></div>
        </div>
        <div class="tc-desc">${escapeHtml(item.desc)}</div>
        <div class="tc-foot">
          <div class="tc-dates">${added ? `<span class="tc-date tc-date-start"><i class="fa fa-calendar-plus"></i> Added: ${added}</span>` : ""}<span class="tc-date tc-date-reg"><i class="fa fa-calendar-check"></i> Notification Date: ${item.lastDate}</span></div>
          <div class="tc-actions">
            <a href="${item.notificationLink}" class="tc-btn tc-btn-g" target="_blank"><i class="fa fa-trophy"></i> Check Result</a>
            <a href="${item.officialLink}" class="tc-btn tc-btn-o" target="_blank"><i class="fa fa-globe"></i> Official Website</a>
          </div>
        </div>
      </div>
    </div>`;
}

function renderResults(results) {
  const list = document.getElementById("resultList");
  const count = document.getElementById("resultCount");
  const empty = document.getElementById("noResultsFound");
  if (!list) return;
  list.innerHTML = results.map(buildResultCard).join("");
  if (count) count.textContent = `${results.length} Declared`;
  if (empty) empty.style.display = results.length ? "none" : "block";
}

/* ---------- Header stats: "Updated <Month Year> · N+ live openings",
   "Jobs Listed" counter ---------- */

function updateHeaderStats(jobs, admitCards, results) {
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const now = new Date();

  const tag = document.getElementById("heroUpdatedTag");
  if (tag) tag.textContent = `${months[now.getMonth()]} ${now.getFullYear()}`;

  const total = jobs.length + admitCards.length + results.length;
  const openCount = document.getElementById("heroOpenCount");
  if (openCount) openCount.textContent = `${total}+`;

  const statEl = document.getElementById("statJobsListed");
  if (statEl) {
    statEl.setAttribute("data-target", String(jobs.length));
    // If the counter animation already ran (element was in view before
    // this data arrived), correct the displayed number directly too.
    if (!isNaN(parseInt(statEl.textContent, 10))) statEl.textContent = String(jobs.length);
  }
}

/* ---------- Boot + periodic refresh ---------- */

document.addEventListener("DOMContentLoaded", loadJobs);
// Re-check for freshly scraped content every 15 minutes without a page reload
setInterval(loadJobs, 15 * 60 * 1000);
