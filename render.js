/* Valley Desk — dynamic content renderer
   Fetches jobs.json, admitcards.json, and results.json, and fills the
   theme's three empty sections (#jobsContainer, #admitCardSection,
   #resultSection) using the SAME classes the theme's CSS and
   filterCat()/liveSearch() functions already expect. index.html only
   needs the empty containers — this script does the rest. */

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

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;").toLowerCase();
}

/* ---------- JOBS (#jobsContainer) ---------- */

async function loadJobs() {
  try {
    const res = await fetch("jobs.json?_=" + Date.now());
    const jobs = await res.json();
    renderJobs(jobs);
  } catch (e) {
    console.error("Could not load jobs.json", e);
  }
}

function buildJobCard(job) {
  const badges = (job.badges || [])
    .map((b) => `<span class="tcb ${b.cls}">${b.label}</span>`)
    .join("");
  return `
    <div class="tool-card" data-cat="${job.category}" data-name="${escapeAttr(job.name)}">
      <div class="tc-body">
        <div class="tc-top">
          <div class="tc-name-wrap">
            <div class="tc-name">${job.name}</div>
            <div class="tc-ver">${job.subtitle || ""}</div>
          </div>
          <div class="tc-badges">${badges}</div>
        </div>
        <div class="tc-desc">${job.desc || ""}</div>
        <div class="tc-foot">
          <div class="tc-dates"><span class="tc-date tc-date-reg"><i class="fa fa-calendar-xmark"></i> Last Date Of Applying: ${job.lastDate || "--/--/----"}</span></div>
          <div class="tc-actions">
            <a href="${job.applyLink || "#"}" class="tc-btn tc-btn-g" target="_blank"><i class="fa fa-paper-plane"></i> Apply Now</a>
            <a href="${job.notificationLink || "#"}" class="tc-btn tc-btn-b" target="_blank"><i class="fa fa-file-pdf"></i> Notification</a>
            <a href="${job.officialLink || "#"}" class="tc-btn tc-btn-o" target="_blank"><i class="fa fa-globe"></i> Official Website</a>
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
    if (!catJobs || !catJobs.length) return;
    anyJobs = true;
    const meta = CATEGORY_META[catKey];
    html += `
      <div class="cat-section-hd" data-section="${catKey}" style="background:${meta.color}29;border:1px solid ${meta.color}66;border-left-color:${meta.color};box-shadow:0 3px 12px ${meta.color}2e">
        <div class="csh-icon">${meta.icon}</div>
        <div class="csh-info"><div class="csh-title">${meta.title}</div><div class="csh-desc">${meta.desc}</div></div>
        <div class="csh-count" style="color:${meta.color}">${catJobs.length} Jobs</div>
      </div>
      <div class="tools-list">${catJobs.map(buildJobCard).join("")}</div>`;
  });

  slot.innerHTML = html;

  const noResults = document.getElementById("noResults");
  if (noResults) noResults.style.display = anyJobs ? "none" : "block";
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

function buildAdmitCard(item) {
  const badges = (item.badges || [])
    .map((b) => `<span class="tcb ${b.cls}">${b.label}</span>`)
    .join("");
  return `
    <div class="tool-card" data-name="${escapeAttr(item.name)}">
      <div class="tc-body">
        <div class="tc-top">
          <div class="tc-name-wrap"><div class="tc-name">${item.name}</div><div class="tc-ver">${item.subtitle || ""}</div></div>
          <div class="tc-badges">${badges}</div>
        </div>
        <div class="tc-desc">${item.desc || ""}</div>
        <div class="tc-foot">
          <div class="tc-dates"><span class="tc-date tc-date-start"><i class="fa fa-calendar-plus"></i> Released On: ${item.releasedOn || "--/--/----"}</span><span class="tc-date tc-date-reg"><i class="fa fa-calendar-check"></i> Exam Date: ${item.examDate || "--/--/----"}</span></div>
          <div class="tc-actions">
            <a href="${item.downloadLink || "#"}" class="tc-btn tc-btn-g" target="_blank"><i class="fa fa-download"></i> Download Admit Card</a>
            <a href="${item.officialLink || "#"}" class="tc-btn tc-btn-o" target="_blank"><i class="fa fa-globe"></i> Official Website</a>
          </div>
        </div>
      </div>
    </div>`;
}

function renderAdmitCards(cards) {
  const list = document.getElementById("admitCardList");
  const count = document.getElementById("admitCardCount");
  if (!list) return;
  list.innerHTML = cards.map(buildAdmitCard).join("");
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

function buildResultCard(item) {
  const badges = (item.badges || [])
    .map((b) => `<span class="tcb ${b.cls}">${b.label}</span>`)
    .join("");
  return `
    <div class="tool-card" data-name="${escapeAttr(item.name)}">
      <div class="tc-body">
        <div class="tc-top">
          <div class="tc-name-wrap"><div class="tc-name">${item.name}</div><div class="tc-ver">${item.subtitle || ""}</div></div>
          <div class="tc-badges">${badges}</div>
        </div>
        <div class="tc-desc">${item.desc || ""}</div>
        <div class="tc-foot">
          <div class="tc-dates"><span class="tc-date tc-date-start"><i class="fa fa-calendar-plus"></i> Declared On: ${item.declaredOn || "--/--/----"}</span><span class="tc-date tc-date-reg"><i class="fa fa-calendar-check"></i> Next Stage: ${item.nextStage || "--"}</span></div>
          <div class="tc-actions">
            <a href="${item.resultLink || "#"}" class="tc-btn tc-btn-g" target="_blank"><i class="fa fa-trophy"></i> Check Result</a>
            <a href="${item.officialLink || "#"}" class="tc-btn tc-btn-o" target="_blank"><i class="fa fa-globe"></i> Official Website</a>
          </div>
        </div>
      </div>
    </div>`;
}

function renderResults(results) {
  const list = document.getElementById("resultList");
  const count = document.getElementById("resultCount");
  if (!list) return;
  list.innerHTML = results.map(buildResultCard).join("");
  if (count) count.textContent = `${results.length} Declared`;
}

/* ---------- Boot + periodic refresh ---------- */

function loadAll() {
  loadJobs();
  loadAdmitCards();
  loadResults();
}

document.addEventListener("DOMContentLoaded", loadAll);
// Re-check for freshly scraped content every 15 minutes without a page reload
setInterval(loadAll, 15 * 60 * 1000);
