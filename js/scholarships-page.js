/* Valley Desk — scholarships.html: full, paginated scholarship listing.
   Relies on common.js (buildScholarshipCard, paginateArray, renderPagination)
   loaded before this file. */

const SCHOLARSHIPS_PAGE_SIZE = 10;
const scholarshipsPageState = { all: [], page: 1 };

async function initScholarshipsPage() {
  try {
    const res = await fetch("scholarships.json?_=" + Date.now());
    scholarshipsPageState.all = await res.json();
  } catch (e) {
    console.error("Could not load scholarships.json", e);
    scholarshipsPageState.all = [];
  }
  renderScholarshipsPage();
}

function renderScholarshipsPage() {
  const slot = document.getElementById("scholarshipsListSlot");
  const noResults = document.getElementById("noResults");
  const totalChip = document.getElementById("scholarshipsTotalChip");
  const pgInfo = document.getElementById("scholarshipsPgInfo");
  const paginationEl = document.getElementById("scholarshipsPagination");
  if (!slot) return;

  const items = scholarshipsPageState.all;
  if (totalChip) totalChip.textContent = `${items.length} Listed`;

  if (!items.length) {
    slot.innerHTML = "";
    if (noResults) noResults.style.display = "block";
    if (pgInfo) pgInfo.textContent = "";
    if (paginationEl) paginationEl.innerHTML = "";
    return;
  }
  if (noResults) noResults.style.display = "none";

  const totalPages = Math.max(1, Math.ceil(items.length / SCHOLARSHIPS_PAGE_SIZE));
  if (scholarshipsPageState.page > totalPages) scholarshipsPageState.page = totalPages;
  if (scholarshipsPageState.page < 1) scholarshipsPageState.page = 1;

  const pageItems = paginateArray(items, scholarshipsPageState.page, SCHOLARSHIPS_PAGE_SIZE);
  slot.innerHTML = pageItems.map(buildScholarshipCard).join("");

  const start = (scholarshipsPageState.page - 1) * SCHOLARSHIPS_PAGE_SIZE + 1;
  const end = Math.min(scholarshipsPageState.page * SCHOLARSHIPS_PAGE_SIZE, items.length);
  if (pgInfo) pgInfo.textContent = `Showing ${start}–${end} of ${items.length} scholarships`;

  renderPagination(paginationEl, items.length, SCHOLARSHIPS_PAGE_SIZE, scholarshipsPageState.page, (newPage) => {
    scholarshipsPageState.page = newPage;
    renderScholarshipsPage();
    document.querySelector(".subpage-hero").scrollIntoView({ behavior: "smooth" });
  });
}

document.addEventListener("DOMContentLoaded", initScholarshipsPage);
