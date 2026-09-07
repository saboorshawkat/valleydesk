/* Valley Desk — jobs.html: full, filterable, paginated job listing.
   Relies on common.js (CATEGORY_META, categoryMetaFor, buildJobCard,
   paginateArray, renderPagination) loaded before this file. */

const JOBS_PAGE_SIZE = 10;

const jobsPageState = {
  all: [],
  cat: "all",
  page: 1,
};

async function initJobsPage() {
  try {
    const res = await fetch("jobs.json?_=" + Date.now());
    jobsPageState.all = await res.json();
  } catch (e) {
    console.error("Could not load jobs.json", e);
    jobsPageState.all = [];
  }

  // Deep-link support: jobs.html#jkssb pre-selects that category.
  const hashCat = (window.location.hash || "").replace("#", "");
  if (hashCat) setJobsCategory(hashCat, false);

  document.querySelectorAll("#catStrip .cs-btn").forEach((btn) => {
    btn.addEventListener("click", () => setJobsCategory(btn.getAttribute("data-cat"), true));
  });
  document.querySelectorAll("[data-jump-cat]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      setJobsCategory(link.getAttribute("data-jump-cat"), true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  renderJobsPage();
}

function setJobsCategory(cat, resetPage) {
  jobsPageState.cat = cat;
  if (resetPage) jobsPageState.page = 1;
  document.querySelectorAll("#catStrip .cs-btn").forEach((b) => {
    b.classList.toggle("act", b.getAttribute("data-cat") === cat);
  });
  renderJobsPage();
}

function getFilteredJobs() {
  if (jobsPageState.cat === "all") return jobsPageState.all;
  return jobsPageState.all.filter((j) => j.category === jobsPageState.cat);
}

function renderJobsPage() {
  const slot = document.getElementById("jobsListSlot");
  const noResults = document.getElementById("noResults");
  const totalChip = document.getElementById("jobsTotalChip");
  const pgInfo = document.getElementById("jobsPgInfo");
  const paginationEl = document.getElementById("jobsPagination");
  if (!slot) return;

  const filtered = getFilteredJobs();
  const totalPages = Math.max(1, Math.ceil(filtered.length / JOBS_PAGE_SIZE));
  if (jobsPageState.page > totalPages) jobsPageState.page = totalPages;
  if (jobsPageState.page < 1) jobsPageState.page = 1;

  if (totalChip) totalChip.textContent = `${jobsPageState.all.length} Jobs`;

  if (!filtered.length) {
    slot.innerHTML = "";
    if (noResults) noResults.style.display = "block";
    if (pgInfo) pgInfo.textContent = "";
    if (paginationEl) paginationEl.innerHTML = "";
    return;
  }
  if (noResults) noResults.style.display = "none";

  const pageItems = paginateArray(filtered, jobsPageState.page, JOBS_PAGE_SIZE);

  let html = "";
  if (jobsPageState.cat === "all") {
    // Group this page's items by category so headers still make sense.
    const byCat = {};
    const order = [];
    pageItems.forEach((j) => {
      if (!byCat[j.category]) {
        byCat[j.category] = [];
        order.push(j.category);
      }
      byCat[j.category].push(j);
    });
    order.forEach((catKey) => {
      const meta = categoryMetaFor(catKey);
      const catJobs = byCat[catKey];
      html += `
        <div class="cat-section-hd" style="background:${meta.color}29;border:1px solid ${meta.color}66;border-left-color:${meta.color};box-shadow:0 3px 12px ${meta.color}2e">
          <div class="csh-icon">${meta.icon}</div>
          <div class="csh-info"><div class="csh-title">${meta.title}</div><div class="csh-desc">${meta.desc}</div></div>
          <div class="csh-count" style="color:${meta.color}">${catJobs.length} on this page</div>
        </div>
        <div class="tools-list">${catJobs.map(buildJobCard).join("")}</div>`;
    });
  } else {
    const meta = categoryMetaFor(jobsPageState.cat);
    html += `
      <div class="cat-section-hd" style="background:${meta.color}29;border:1px solid ${meta.color}66;border-left-color:${meta.color};box-shadow:0 3px 12px ${meta.color}2e">
        <div class="csh-icon">${meta.icon}</div>
        <div class="csh-info"><div class="csh-title">${meta.title}</div><div class="csh-desc">${meta.desc}</div></div>
        <div class="csh-count" style="color:${meta.color}">${filtered.length} Jobs</div>
      </div>
      <div class="tools-list">${pageItems.map(buildJobCard).join("")}</div>`;
  }

  slot.innerHTML = html;

  const start = (jobsPageState.page - 1) * JOBS_PAGE_SIZE + 1;
  const end = Math.min(jobsPageState.page * JOBS_PAGE_SIZE, filtered.length);
  if (pgInfo) pgInfo.textContent = `Showing ${start}–${end} of ${filtered.length} jobs`;

  renderPagination(paginationEl, filtered.length, JOBS_PAGE_SIZE, jobsPageState.page, (newPage) => {
    jobsPageState.page = newPage;
    renderJobsPage();
    document.querySelector(".subpage-hero").scrollIntoView({ behavior: "smooth" });
  });
}

document.addEventListener("DOMContentLoaded", initJobsPage);
