/* Valley Desk — examdates.html: full, filterable, paginated listing of
   student exam dates (JKBOSE, NEET, JEE, JKBOPEE, JKSSB & more).
   Mirrors jobs-page.js but reads examdates.json, uses EXAM_CATEGORY_META /
   buildExamCard, and filters on data-examcat instead of data-cat so it
   never touches the govt-job cards elsewhere on the site.
   Relies on common.js loaded before this file. */

const EXAM_PAGE_SIZE = 10;

const examPageState = {
  all: [],
  cat: "all",
  page: 1,
};

async function initExamPage() {
  try {
    const res = await fetch("examdates.json?_=" + Date.now());
    examPageState.all = await res.json();
  } catch (e) {
    console.error("Could not load examdates.json", e);
    examPageState.all = [];
  }

  // Deep-link support: examdates.html#neet pre-selects that category.
  const hashCat = (window.location.hash || "").replace("#", "");
  if (hashCat) setExamCategory(hashCat, false);

  document.querySelectorAll("#catStrip .cs-btn").forEach((btn) => {
    btn.addEventListener("click", () => setExamCategory(btn.getAttribute("data-cat"), true));
  });
  document.querySelectorAll("[data-jump-cat]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      setExamCategory(link.getAttribute("data-jump-cat"), true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  renderExamPage();
}

function setExamCategory(cat, resetPage) {
  examPageState.cat = cat;
  if (resetPage) examPageState.page = 1;
  document.querySelectorAll("#catStrip .cs-btn").forEach((b) => {
    b.classList.toggle("act", b.getAttribute("data-cat") === cat);
  });
  renderExamPage();
}

function getFilteredExams() {
  if (examPageState.cat === "all") return examPageState.all;
  return examPageState.all.filter((x) => x.category === examPageState.cat);
}

function renderExamPage() {
  const slot = document.getElementById("examListSlot");
  const noResults = document.getElementById("noResults");
  const totalChip = document.getElementById("examTotalChip");
  const pgInfo = document.getElementById("examPgInfo");
  const paginationEl = document.getElementById("examPagination");
  if (!slot) return;

  const filtered = getFilteredExams();
  const totalPages = Math.max(1, Math.ceil(filtered.length / EXAM_PAGE_SIZE));
  if (examPageState.page > totalPages) examPageState.page = totalPages;
  if (examPageState.page < 1) examPageState.page = 1;

  if (totalChip) totalChip.textContent = `${examPageState.all.length} Tracked`;

  if (!filtered.length) {
    slot.innerHTML = "";
    if (noResults) noResults.style.display = "block";
    if (pgInfo) pgInfo.textContent = "";
    if (paginationEl) paginationEl.innerHTML = "";
    return;
  }
  if (noResults) noResults.style.display = "none";

  const pageItems = paginateArray(filtered, examPageState.page, EXAM_PAGE_SIZE);

  let html = "";
  if (examPageState.cat === "all") {
    const byCat = {};
    const order = [];
    pageItems.forEach((x) => {
      if (!byCat[x.category]) {
        byCat[x.category] = [];
        order.push(x.category);
      }
      byCat[x.category].push(x);
    });
    order.forEach((catKey) => {
      const meta = examCategoryMetaFor(catKey);
      const catExams = byCat[catKey];
      html += `
        <div class="cat-section-hd" style="background:${meta.color}29;border:1px solid ${meta.color}66;border-left-color:${meta.color};box-shadow:0 3px 12px ${meta.color}2e">
          <div class="csh-icon">${meta.icon}</div>
          <div class="csh-info"><div class="csh-title">${meta.title}</div><div class="csh-desc">${meta.desc}</div></div>
          <div class="csh-count" style="color:${meta.color}">${catExams.length} on this page</div>
        </div>
        <div class="tools-list">${catExams.map(buildExamCard).join("")}</div>`;
    });
  } else {
    const meta = examCategoryMetaFor(examPageState.cat);
    html += `
      <div class="cat-section-hd" style="background:${meta.color}29;border:1px solid ${meta.color}66;border-left-color:${meta.color};box-shadow:0 3px 12px ${meta.color}2e">
        <div class="csh-icon">${meta.icon}</div>
        <div class="csh-info"><div class="csh-title">${meta.title}</div><div class="csh-desc">${meta.desc}</div></div>
        <div class="csh-count" style="color:${meta.color}">${filtered.length}</div>
      </div>
      <div class="tools-list">${pageItems.map(buildExamCard).join("")}</div>`;
  }

  slot.innerHTML = html;

  const start = (examPageState.page - 1) * EXAM_PAGE_SIZE + 1;
  const end = Math.min(examPageState.page * EXAM_PAGE_SIZE, filtered.length);
  if (pgInfo) pgInfo.textContent = `Showing ${start}–${end} of ${filtered.length} exam updates`;

  renderPagination(paginationEl, filtered.length, EXAM_PAGE_SIZE, examPageState.page, (newPage) => {
    examPageState.page = newPage;
    renderExamPage();
    document.querySelector(".subpage-hero").scrollIntoView({ behavior: "smooth" });
  });
}

document.addEventListener("DOMContentLoaded", initExamPage);
