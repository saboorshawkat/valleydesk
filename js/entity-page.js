/* Valley Desk — shared script for every entity deep-page:
   jkssb.html, jkpsc.html, jkpolice.html, kashmir-university.html,
   central-university.html.
   The page tells this script who it is via <body data-entity="jkssb">;
   everything else (title, icon, colour, which sections to show) is
   derived from that + CATEGORY_META, so one file drives all five pages. */

async function initEntityPage() {
  const entity = document.body.getAttribute("data-entity");
  if (!entity) return;
  const meta = categoryMetaFor(entity);

  // Paint the header from CATEGORY_META so every entity page looks right
  // without needing five near-identical <script> blocks.
  const iconEl = document.getElementById("entityIcon");
  const titleEl = document.getElementById("entityTitle");
  const descEl = document.getElementById("entityDesc");
  if (iconEl) iconEl.textContent = meta.icon;
  if (titleEl) titleEl.textContent = meta.title;
  if (descEl) descEl.textContent = meta.desc;
  document.querySelectorAll(".entity-accent").forEach((el) => {
    el.style.setProperty("--accent", meta.color);
  });

  const [jobs, admits, results, exams, materials] = await Promise.all([
    fetchJSON("jobs.json"),
    fetchJSON("admitcards.json"),
    fetchJSON("results.json"),
    fetchJSON("examdates.json"),
    fetchJSON("studymaterial.json"),
  ]);

  renderEntitySection("entityJobs", "entityJobsCount", "entityJobsSection", jobs.filter((j) => j.category === entity), buildJobCard);
  renderEntitySection("entityExams", "entityExamsCount", "entityExamsSection", exams.filter((e) => e.category === entity), buildExamCard);
  renderEntitySection("entityAdmit", "entityAdmitCount", "entityAdmitSection", admits.filter((a) => a.category === entity), buildAdmitCard);
  renderEntitySection("entityResults", "entityResultsCount", "entityResultsSection", results.filter((r) => r.category === entity), buildResultCard);
  renderEntitySection("entityStudy", "entityStudyCount", "entityStudySection", materials.filter((m) => m.category === entity), buildStudyCard);
}

async function fetchJSON(file) {
  try {
    const res = await fetch(file + "?_=" + Date.now());
    return await res.json();
  } catch (e) {
    console.error("Could not load " + file, e);
    return [];
  }
}

/* Fills one section's list + count chip, and hides the whole section when
   there's nothing to show — e.g. jkpolice.html simply won't render an
   Exam Dates section since JK Police has no entries in examdates.json. */
function renderEntitySection(slotId, countId, sectionId, items, builder) {
  const slot = document.getElementById(slotId);
  const countEl = document.getElementById(countId);
  const section = document.getElementById(sectionId);

  if (countEl) countEl.textContent = items.length;

  if (!items.length) {
    if (section) section.style.display = "none";
    return;
  }
  if (section) section.style.display = "";
  if (slot) slot.innerHTML = items.map(builder).join("");
}

document.addEventListener("DOMContentLoaded", initEntityPage);
