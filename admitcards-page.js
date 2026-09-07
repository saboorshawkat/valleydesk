/* Valley Desk — admitcards.html: full, paginated admit card listing.
   Relies on common.js (buildAdmitCard, paginateArray, renderPagination)
   loaded before this file. */

const ADMIT_PAGE_SIZE = 10;
const admitPageState = { all: [], page: 1 };

async function initAdmitCardsPage() {
  try {
    const res = await fetch("admitcards.json?_=" + Date.now());
    admitPageState.all = await res.json();
  } catch (e) {
    console.error("Could not load admitcards.json", e);
    admitPageState.all = [];
  }
  renderAdmitCardsPage();
}

function renderAdmitCardsPage() {
  const slot = document.getElementById("admitCardsListSlot");
  const noResults = document.getElementById("noResults");
  const totalChip = document.getElementById("admitCardsTotalChip");
  const pgInfo = document.getElementById("admitCardsPgInfo");
  const paginationEl = document.getElementById("admitCardsPagination");
  if (!slot) return;

  const items = admitPageState.all;
  if (totalChip) totalChip.textContent = `${items.length} Released`;

  if (!items.length) {
    slot.innerHTML = "";
    if (noResults) noResults.style.display = "block";
    if (pgInfo) pgInfo.textContent = "";
    if (paginationEl) paginationEl.innerHTML = "";
    return;
  }
  if (noResults) noResults.style.display = "none";

  const totalPages = Math.max(1, Math.ceil(items.length / ADMIT_PAGE_SIZE));
  if (admitPageState.page > totalPages) admitPageState.page = totalPages;
  if (admitPageState.page < 1) admitPageState.page = 1;

  const pageItems = paginateArray(items, admitPageState.page, ADMIT_PAGE_SIZE);
  slot.innerHTML = pageItems.map(buildAdmitCard).join("");

  const start = (admitPageState.page - 1) * ADMIT_PAGE_SIZE + 1;
  const end = Math.min(admitPageState.page * ADMIT_PAGE_SIZE, items.length);
  if (pgInfo) pgInfo.textContent = `Showing ${start}–${end} of ${items.length} admit cards`;

  renderPagination(paginationEl, items.length, ADMIT_PAGE_SIZE, admitPageState.page, (newPage) => {
    admitPageState.page = newPage;
    renderAdmitCardsPage();
    document.querySelector(".subpage-hero").scrollIntoView({ behavior: "smooth" });
  });
}

document.addEventListener("DOMContentLoaded", initAdmitCardsPage);
