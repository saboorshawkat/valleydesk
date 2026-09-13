/* Valley Desk — exams.html: full, paginated exam listing.
   Relies on common.js (buildExamCard, paginateArray, renderPagination)
   loaded before this file. */

const EXAMS_PAGE_SIZE = 10;
const examsPageState = { all: [], page: 1 };

async function initExamsPage() {
  try {
    const res = await fetch("exams.json?_=" + Date.now());
    examsPageState.all = await res.json();
  } catch (e) {
    console.error("Could not load exams.json", e);
    examsPageState.all = [];
  }
  renderExamsPage();
}

function renderExamsPage() {
  const slot = document.getElementById("examsListSlot");
  const noResults = document.getElementById("noResults");
  const totalChip = document.getElementById("examsTotalChip");
  const pgInfo = document.getElementById("examsPgInfo");
  const paginationEl = document.getElementById("examsPagination");
  if (!slot) return;

  const items = examsPageState.all;
  if (totalChip) totalChip.textContent = `${items.length} Listed`;

  if (!items.length) {
    slot.innerHTML = "";
    if (noResults) noResults.style.display = "block";
    if (pgInfo) pgInfo.textContent = "";
    if (paginationEl) paginationEl.innerHTML = "";
    return;
  }
  if (noResults) noResults.style.display = "none";

  const totalPages = Math.max(1, Math.ceil(items.length / EXAMS_PAGE_SIZE));
  if (examsPageState.page > totalPages) examsPageState.page = totalPages;
  if (examsPageState.page < 1) examsPageState.page = 1;

  const pageItems = paginateArray(items, examsPageState.page, EXAMS_PAGE_SIZE);
  slot.innerHTML = pageItems.map(buildExamCard).join("");

  const start = (examsPageState.page - 1) * EXAMS_PAGE_SIZE + 1;
  const end = Math.min(examsPageState.page * EXAMS_PAGE_SIZE, items.length);
  if (pgInfo) pgInfo.textContent = `Showing ${start}–${end} of ${items.length} exams`;

  renderPagination(paginationEl, items.length, EXAMS_PAGE_SIZE, examsPageState.page, (newPage) => {
    examsPageState.page = newPage;
    renderExamsPage();
    document.querySelector(".subpage-hero").scrollIntoView({ behavior: "smooth" });
  });
}

document.addEventListener("DOMContentLoaded", initExamsPage);
