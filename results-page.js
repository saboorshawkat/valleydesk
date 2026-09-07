/* Valley Desk — results.html: full, paginated results listing.
   Relies on common.js (buildResultCard, paginateArray, renderPagination)
   loaded before this file. */

const RESULTS_PAGE_SIZE = 10;
const resultsPageState = { all: [], page: 1 };

async function initResultsPage() {
  try {
    const res = await fetch("results.json?_=" + Date.now());
    resultsPageState.all = await res.json();
  } catch (e) {
    console.error("Could not load results.json", e);
    resultsPageState.all = [];
  }
  renderResultsPage();
}

function renderResultsPage() {
  const slot = document.getElementById("resultsListSlot");
  const noResults = document.getElementById("noResults");
  const totalChip = document.getElementById("resultsTotalChip");
  const pgInfo = document.getElementById("resultsPgInfo");
  const paginationEl = document.getElementById("resultsPagination");
  if (!slot) return;

  const items = resultsPageState.all;
  if (totalChip) totalChip.textContent = `${items.length} Declared`;

  if (!items.length) {
    slot.innerHTML = "";
    if (noResults) noResults.style.display = "block";
    if (pgInfo) pgInfo.textContent = "";
    if (paginationEl) paginationEl.innerHTML = "";
    return;
  }
  if (noResults) noResults.style.display = "none";

  const totalPages = Math.max(1, Math.ceil(items.length / RESULTS_PAGE_SIZE));
  if (resultsPageState.page > totalPages) resultsPageState.page = totalPages;
  if (resultsPageState.page < 1) resultsPageState.page = 1;

  const pageItems = paginateArray(items, resultsPageState.page, RESULTS_PAGE_SIZE);
  slot.innerHTML = pageItems.map(buildResultCard).join("");

  const start = (resultsPageState.page - 1) * RESULTS_PAGE_SIZE + 1;
  const end = Math.min(resultsPageState.page * RESULTS_PAGE_SIZE, items.length);
  if (pgInfo) pgInfo.textContent = `Showing ${start}–${end} of ${items.length} results`;

  renderPagination(paginationEl, items.length, RESULTS_PAGE_SIZE, resultsPageState.page, (newPage) => {
    resultsPageState.page = newPage;
    renderResultsPage();
    document.querySelector(".subpage-hero").scrollIntoView({ behavior: "smooth" });
  });
}

document.addEventListener("DOMContentLoaded", initResultsPage);
