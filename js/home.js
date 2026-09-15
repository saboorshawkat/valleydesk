/* Valley Desk — home.js
   Renders index.html: live counts on the 9-card category grid, and a
   mixed "Latest Updates" feed built by combining each category's own
   admit-card / result / notification entries — read straight from
   json/<category>.json, the same files the category pages use. */

const HOME_CATEGORIES = [
  "jkbose",
  "jkbopee",
  "jkssb",
  "jkpsc",
  "neet",
  "jee",
  "kashmir-university",
  "central-university",
  "cuet",
];

/* Brand colour per category (matches json/<slug>.json meta.color).
   getAccentStrong() (common.js) darkens the ones that are too light
   (yellow, mint, sky blue, pink, lavender, orange) to a readable,
   contrast-safe shade before it's used as plain text/badge colour. */
const HOME_ACCENT = {
  jkbose: "#e8590c",
  jkbopee: "#c2410c",
  jkssb: "#eab308",
  jkpsc: "#a16207",
  neet: "#c81e1e",
  jee: "#b5622f",
  "kashmir-university": "#8b2942",
  "central-university": "#6b4226",
  cuet: "#f2751a",
};

async function loadHome() {
  const results = await Promise.all(
    HOME_CATEGORIES.map((slug) =>
      fetch("json/" + slug + ".json?_=" + Date.now())
        .then((r) => r.json())
        .catch(() => null)
    )
  );

  const bySlug = {};
  HOME_CATEGORIES.forEach((slug, i) => {
    if (results[i]) bySlug[slug] = results[i];
  });

  paintCategoryGrid(bySlug);
  paintLatestFeed(bySlug);
  paintMastheadStats(bySlug);
}

/* ---------- Category grid live counts ---------- */

function totalForCategory(data) {
  if (!data) return 0;
  return (
    (data.notifications || []).length +
    (data.examdates || []).length +
    (data.admitcards || []).length +
    (data.results || []).length +
    (data.studymaterial || []).length
  );
}

function paintCategoryGrid(bySlug) {
  document.querySelectorAll("#homeCatGrid .cat-grid-card").forEach((card) => {
    const slug = card.getAttribute("data-cat");
    const countEl = card.querySelector(".cgc-count");
    if (countEl && slug) countEl.textContent = `${totalForCategory(bySlug[slug])} Updates`;
    const strong = HOME_ACCENT[slug] ? getAccentStrong(HOME_ACCENT[slug]) : null;
    if (strong) {
      if (countEl) countEl.style.color = strong;
      const arrowEl = card.querySelector(".cgc-arrow");
      if (arrowEl) arrowEl.style.color = strong;
    }
  });
}

/* ---------- Latest Updates feed (mixed admit cards + results + notifications) ---------- */

function feedCard(item, section, meta) {
  const tagColor = getAccentStrong(meta.color);
  const sectionLabel = { admitcards: "Admit Card", results: "Result", notifications: "Notification" }[section];
  const primaryLink = item.downloadLink || item.resultLink || item.applyLink || item.officialLink || "#";
  const primaryLabel = { admitcards: "Download", results: "Check Result", notifications: "Apply Now" }[section];
  const primaryIcon = { admitcards: "fa-download", results: "fa-trophy", notifications: "fa-paper-plane" }[section];
  const dateLine =
    section === "admitcards"
      ? `<i class="fa fa-calendar-check"></i> Exam Date: ${item.examDate || "--/--/----"}`
      : section === "results"
      ? `<i class="fa fa-calendar-plus"></i> Declared: ${item.declaredOn || "--/--/----"}`
      : `<i class="fa fa-calendar-xmark"></i> Last Date: ${item.lastDate || "--/--/----"}`;
  return `
    <div class="tool-card" data-feed-section="${section}" data-name="${escapeAttr(item.name)}">
      <div class="tc-body">
        <div class="tc-top">
          <div class="tc-name-wrap">
            <div class="tc-name">${item.name}</div>
            <div class="tc-ver">${item.subtitle || ""}</div>
          </div>
          <div class="tc-badges">
            <span class="feed-cat-tag" style="background:${tagColor}1f;border:1px solid ${tagColor}55;color:${tagColor}">${meta.icon} ${meta.shortTitle}</span>
            <span class="tcb tcb-b">${sectionLabel}</span>
          </div>
        </div>
        <div class="tc-desc">${item.desc || ""}</div>
        <div class="tc-foot">
          <div class="tc-dates"><span class="tc-date tc-date-reg">${dateLine}</span></div>
          <div class="tc-actions">
            <a href="${primaryLink}" class="tc-btn tc-btn-g" target="_blank"><i class="fa ${primaryIcon}"></i> ${primaryLabel}</a>
            <a href="${item.officialLink || "#"}" class="tc-btn tc-btn-o" target="_blank"><i class="fa fa-globe"></i> Official Website</a>
          </div>
        </div>
      </div>
    </div>`;
}

let _feedItems = [];

function paintLatestFeed(bySlug) {
  const items = [];
  HOME_CATEGORIES.forEach((slug) => {
    const data = bySlug[slug];
    if (!data) return;
    const meta = data.meta || {};
    ["notifications", "admitcards", "results"].forEach((section) => {
      (data[section] || []).forEach((item) => items.push({ item, section, meta }));
    });
  });

  _feedItems = items.slice(0, 10);

  const countEl = document.getElementById("latestFeedCount");
  if (countEl) countEl.textContent = _feedItems.length;

  renderFeed("all");
}

function renderFeed(filter) {
  const slot = document.getElementById("latestFeedList");
  if (!slot) return;
  const filtered = filter === "all" ? _feedItems : _feedItems.filter((f) => f.section === filter);
  if (!filtered.length) {
    slot.innerHTML = '<div class="entity-empty"><i class="fa-regular fa-folder-open"></i>No updates in this filter yet.</div>';
    return;
  }
  slot.innerHTML = filtered.map((f) => feedCard(f.item, f.section, f.meta)).join("");
}

function initFeedTabs() {
  const tabs = document.querySelectorAll("#latestFeedTabs .feed-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      tabs.forEach((t) => t.classList.remove("act"));
      this.classList.add("act");
      renderFeed(this.getAttribute("data-feed-filter"));
    });
  });
}

/* ---------- Masthead stats ---------- */

function paintMastheadStats(bySlug) {
  let total = 0;
  let sections = 0;
  HOME_CATEGORIES.forEach((slug) => {
    const t = totalForCategory(bySlug[slug]);
    total += t;
    if (t > 0) sections++;
  });
  const listedEl = document.getElementById("statUpdatesListed");
  if (listedEl) listedEl.textContent = total;
  const categoriesEl = document.getElementById("statCategories");
  if (categoriesEl) categoriesEl.textContent = sections;
}

document.addEventListener("DOMContentLoaded", function () {
  loadHome();
  initFeedTabs();
});
