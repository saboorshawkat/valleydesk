/* Valley Desk — admissions.html: full, paginated admission listing.
   Relies on common.js (buildAdmissionCard, paginateArray, renderPagination)
   loaded before this file. */

const ADMISSIONS_PAGE_SIZE = 10;
const admissionsPageState = { all: [], page: 1 };

async function initAdmissionsPage() {
  try {
    const res = await fetch("admissions.json?_=" + Date.now());
    admissionsPageState.all = await res.json();
  } catch (e) {
    console.error("Could not load admissions.json", e);
    admissionsPageState.all = [];
  }
  renderAdmissionsPage();
}

function renderAdmissionsPage() {
  const slot = document.getElementById("admissionsListSlot");
  const noResults = document.getElementById("noResults");
  const totalChip = document.getElementById("admissionsTotalChip");
  const pgInfo = document.getElementById("admissionsPgInfo");
  const paginationEl = document.getElementById("admissionsPagination");
  if (!slot) return;

  const items = admissionsPageState.all;
  if (totalChip) totalChip.textContent = `${items.length} Listed`;

  if (!items.length) {
    slot.innerHTML = "";
    if (noResults) noResults.style.display = "block";
    if (pgInfo) pgInfo.textContent = "";
    if (paginationEl) paginationEl.innerHTML = "";
    return;
  }
  if (noResults) noResults.style.display = "none";

  const totalPages = Math.max(1, Math.ceil(items.length / ADMISSIONS_PAGE_SIZE));
  if (admissionsPageState.page > totalPages) admissionsPageState.page = totalPages;
  if (admissionsPageState.page < 1) admissionsPageState.page = 1;

  const pageItems = paginateArray(items, admissionsPageState.page, ADMISSIONS_PAGE_SIZE);
  slot.innerHTML = pageItems.map(buildAdmissionCard).join("");

  const start = (admissionsPageState.page - 1) * ADMISSIONS_PAGE_SIZE + 1;
  const end = Math.min(admissionsPageState.page * ADMISSIONS_PAGE_SIZE, items.length);
  if (pgInfo) pgInfo.textContent = `Showing ${start}–${end} of ${items.length} admissions`;

  renderPagination(paginationEl, items.length, ADMISSIONS_PAGE_SIZE, admissionsPageState.page, (newPage) => {
    admissionsPageState.page = newPage;
    renderAdmissionsPage();
    document.querySelector(".subpage-hero").scrollIntoView({ behavior: "smooth" });
  });
}

document.addEventListener("DOMContentLoaded", initAdmissionsPage);
