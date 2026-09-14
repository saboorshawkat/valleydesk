/* Valley Desk — shared logic used on every page (index.html, jobs.html,
   results.html, admitcards.html): theme toggle, live header clock,
   category metadata + card builders, and a small pagination helper. */

/* ---------- Category metadata (with a fallback for anything new) ---------- */

const CATEGORY_META = {
  jkssb:              { icon: "📋", title: "JKSSB Recruitment",         desc: "J&K Services Selection Board",                color: "#0ac16c" },
  jkpsc:              { icon: "⚖️", title: "JKPSC Recruitment",         desc: "Jammu & Kashmir Public Service Commission",   color: "#34d399" },
  jkpolice:           { icon: "👮", title: "JK Police Recruitment",     desc: "Jammu & Kashmir Police Department",           color: "#ff7f50" },
  jkbank:             { icon: "🏦", title: "J&K Bank Recruitment",      desc: "Jammu & Kashmir Bank Ltd",                    color: "#f5c518" },
  jkjudiciary:        { icon: "🏛️", title: "JK Judiciary Recruitment",  desc: "J&K High Court & District Courts",            color: "#38bdf8" },
  jkteaching:         { icon: "📘", title: "JK Teaching Recruitment",   desc: "School Education Department, J&K",            color: "#25d366" },
  jkhealth:           { icon: "🩺", title: "JK Health Dept Recruitment", desc: "SKIMS, GMC & Directorate of Health Services", color: "#fb923c" },
  "kashmir-university": { icon: "🎓", title: "University Of Kashmir",   desc: "Hazratbal, Srinagar",                         color: "#e879f9" },
  "central-university": { icon: "🏫", title: "Central University",     desc: "Central University Of Kashmir & Jammu",       color: "#a78bfa" },
  jkbopee:            { icon: "🎯", title: "JKBOPEE",                 desc: "J&K Board Of Professional Entrance Examinations", color: "#b060ff" },
  jkbose:             { icon: "🏔️", title: "JKBOSE",                  desc: "J&K Board Of School Education",               color: "#0ac16c" },
  neet:               { icon: "🩺", title: "NEET (UG)",               desc: "Medical & Dental Entrance Exam",              color: "#e11d48" },
  jee:                { icon: "⚙️", title: "JEE Main / Advanced",     desc: "Engineering Entrance Exam (NTA / IITs)",      color: "#38bdf8" },
  cuet:               { icon: "🎯", title: "CUET (UG)",               desc: "Common University Entrance Test (NTA)",       color: "#f97316" },
  "other-university":  { icon: "🏫", title: "Other J&K Universities",  desc: "Jammu, SKUAST, IUST, Cluster & More",         color: "#14b8a6" },
};

const FALLBACK_PALETTE = ["#64748b", "#0ea5e9", "#d946ef", "#f97316", "#14b8a6", "#a855f7"];

/* Any job category that isn't in CATEGORY_META (e.g. new categories added to
   jobs.json later) still gets a sensible label/colour instead of being
   silently dropped from counts and listings. */
function categoryMetaFor(catKey) {
  if (CATEGORY_META[catKey]) return CATEGORY_META[catKey];
  const label = String(catKey || "other")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  let hash = 0;
  for (let i = 0; i < String(catKey).length; i++) hash = (hash * 31 + String(catKey).charCodeAt(i)) >>> 0;
  const color = FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
  return { icon: "📌", title: label + " Recruitment", desc: "Jammu & Kashmir Govt Recruitment", color };
}

/* ---------- Student exam category metadata (examdates.json) ---------- */
/* Kept separate from CATEGORY_META (job boards) on purpose — exam cards use
   data-examcat instead of data-cat so the Jobs cat-strip filter and the
   Exam Dates cat-strip filter never fight over the same elements, even
   though a couple of acronyms (JKSSB) legitimately appear in both. */

const EXAM_CATEGORY_META = {
  jkbose:  { icon: "🏔️", title: "JKBOSE 11th / 12th",   desc: "Date Sheets, Admit Cards & Results",        color: "#0ac16c" },
  neet:    { icon: "🩺", title: "NEET (UG)",             desc: "Medical & Dental Entrance Exam",             color: "#e11d48" },
  jee:     { icon: "⚙️", title: "JEE Main / Advanced",   desc: "Engineering Entrance Exam (NTA / IITs)",     color: "#38bdf8" },
  jkbopee: { icon: "🎓", title: "JKBOPEE CET",           desc: "J&K Common Entrance Test — Engg. & Medical", color: "#b060ff" },
  jkssb:   { icon: "📋", title: "JKSSB Exams",           desc: "Combined Competitive / Written Test Dates",  color: "#f5c518" },
  cuet:    { icon: "🎯", title: "CUET (UG)",             desc: "Common University Entrance Test (NTA)",      color: "#f97316" },
  other:   { icon: "📌", title: "Other Popular Exams",   desc: "CBSE, NDA & More",                           color: "#fb923c" },
};

function examCategoryMetaFor(catKey) {
  if (EXAM_CATEGORY_META[catKey]) return EXAM_CATEGORY_META[catKey];
  const label = String(catKey || "other")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  let hash = 0;
  for (let i = 0; i < String(catKey).length; i++) hash = (hash * 31 + String(catKey).charCodeAt(i)) >>> 0;
  const color = FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
  return { icon: "📌", title: label, desc: "Exam Dates & Notices", color };
}

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;").toLowerCase();
}

/* ---------- Card builders (shared by home page + the 3 full-listing pages) ---------- */

function buildJobCard(job) {
  const badges = (job.badges || []).map((b) => `<span class="tcb ${b.cls}">${b.label}</span>`).join("");
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

function buildAdmitCard(item) {
  const badges = (item.badges || []).map((b) => `<span class="tcb ${b.cls}">${b.label}</span>`).join("");
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

function buildResultCard(item) {
  const badges = (item.badges || []).map((b) => `<span class="tcb ${b.cls}">${b.label}</span>`).join("");
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

function buildExamCard(item) {
  const badges = (item.badges || []).map((b) => `<span class="tcb ${b.cls}">${b.label}</span>`).join("");
  const hasExamDate = item.examDate && item.examDate !== "--/--/----";
  const hasLastDate = item.lastDate && item.lastDate !== "--/--/----";
  const dates =
    (hasExamDate ? `<span class="tc-date tc-date-start"><i class="fa fa-calendar-check"></i> Exam Date: ${item.examDate}</span>` : "") +
    (hasLastDate ? `<span class="tc-date tc-date-reg"><i class="fa fa-calendar-xmark"></i> Last Date To Apply: ${item.lastDate}</span>` : "");
  return `
    <div class="tool-card" data-examcat="${item.category}" data-level="${item.level || ""}" data-name="${escapeAttr(item.name)}">
      <div class="tc-body">
        <div class="tc-top">
          <div class="tc-name-wrap">
            <div class="tc-name">${item.name}</div>
            <div class="tc-ver">${item.subtitle || ""}</div>
          </div>
          <div class="tc-badges">${badges}</div>
        </div>
        <div class="tc-desc">${item.desc || ""}</div>
        <div class="tc-foot">
          <div class="tc-dates">${dates}</div>
          <div class="tc-actions">
            <a href="${item.applyLink || "#"}" class="tc-btn tc-btn-g" target="_blank"><i class="fa fa-paper-plane"></i> Apply / Check</a>
            <a href="${item.syllabusLink || "#"}" class="tc-btn tc-btn-b" target="_blank"><i class="fa fa-book"></i> Syllabus</a>
            <a href="${item.officialLink || "#"}" class="tc-btn tc-btn-o" target="_blank"><i class="fa fa-globe"></i> Official Website</a>
          </div>
        </div>
      </div>
    </div>`;
}

/* ---------- Study material cards (studymaterial.json) ---------- */
/* Shared by every entity page (jkssb.html etc.) and entrance-exams.html.
   Schema: name, subtitle, desc, type, year, size, downloadLink, viewLink. */

function buildStudyCard(item) {
  const badges = (item.badges || []).map((b) => `<span class="tcb ${b.cls}">${b.label}</span>`).join("");
  const meta =
    (item.year ? `<span class="tc-date tc-date-start"><i class="fa fa-calendar"></i> ${item.year}</span>` : "") +
    (item.size ? `<span class="tc-date tc-date-reg"><i class="fa fa-file"></i> ${item.size}</span>` : "");
  return `
    <div class="tool-card" data-studycat="${item.category}" data-level="${item.level || ""}" data-name="${escapeAttr(item.name)}">
      <div class="tc-body">
        <div class="tc-top">
          <div class="tc-name-wrap">
            <div class="tc-name">${item.name}</div>
            <div class="tc-ver">${item.subtitle || ""}</div>
          </div>
          <div class="tc-badges">${badges}</div>
        </div>
        <div class="tc-desc">${item.desc || ""}</div>
        <div class="tc-foot">
          <div class="tc-dates">${meta}</div>
          <div class="tc-actions">
            <a href="${item.downloadLink || "#"}" class="tc-btn tc-btn-g" target="_blank"><i class="fa fa-download"></i> Download</a>
            <a href="${item.viewLink || item.downloadLink || "#"}" class="tc-btn tc-btn-o" target="_blank"><i class="fa fa-eye"></i> View Online</a>
          </div>
        </div>
      </div>
    </div>`;
}

/* Slugs with a dedicated deep page (jkssb.html, jkpsc.html, jkpolice.html,
   kashmir-university.html, central-university.html) — used to decide,
   e.g., whether a homepage category card should link to a real page or
   just scroll/filter the homepage's own Jobs section. */
const ENTITY_PAGE_SLUGS = ["jkssb", "jkpsc", "jkpolice", "kashmir-university", "central-university", "jkbopee", "jkbose", "other-university", "neet", "jee", "cuet"];

/* ---------- Pagination helper (shared by jobs.html / results.html / admitcards.html) ---------- */

function paginateArray(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/* Renders Prev / numbered / Next controls into `el` for `totalItems` split
   into pages of `pageSize`, highlighting `currentPage`, and calling
   `onChange(newPage)` when the user picks a different page. */
function renderPagination(el, totalItems, pageSize, currentPage, onChange) {
  if (!el) return;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) {
    el.innerHTML = "";
    return;
  }

  function btn(label, page, opts) {
    opts = opts || {};
    const cls = ["pg-btn", opts.act ? "act" : "", opts.dis ? "pg-dis" : ""].filter(Boolean).join(" ");
    return `<button type="button" class="${cls}" data-page="${page}" ${opts.dis ? "disabled" : ""}>${label}</button>`;
  }

  let html = "";
  html += btn('<i class="fa fa-angle-left"></i>', currentPage - 1, { dis: currentPage === 1 });

  const windowSize = 1;
  const pages = new Set([1, totalPages]);
  for (let p = currentPage - windowSize; p <= currentPage + windowSize; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);
  let prev = 0;
  sorted.forEach((p) => {
    if (p - prev > 1) html += `<span class="pg-ellipsis">…</span>`;
    html += btn(p, p, { act: p === currentPage });
    prev = p;
  });

  html += btn('<i class="fa fa-angle-right"></i>', currentPage + 1, { dis: currentPage === totalPages });
  el.innerHTML = html;

  el.querySelectorAll(".pg-btn:not(.pg-dis)").forEach((b) => {
    b.addEventListener("click", function () {
      const p = parseInt(this.getAttribute("data-page"), 10);
      if (!isNaN(p)) onChange(p);
    });
  });
}

/* ---------- Theme + toast + misc chrome shared by every page ---------- */

function toggleTheme() {
  const html = document.documentElement;
  const cur = html.getAttribute("data-theme");
  const next = cur === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
  try {
    localStorage.setItem("vd-theme", next);
  } catch (e) {
    /* localStorage unavailable (private browsing, etc.) — theme just won't persist */
  }
  showToast(next === "dark" ? "Dark mode enabled" : "Light mode enabled");
}

function showToast(msg) {
  const c = document.getElementById("toastContainer");
  if (!c) return;
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = '<i class="fa fa-check-circle"></i>' + msg;
  c.appendChild(t);
  setTimeout(function () {
    t.remove();
  }, 3000);
}

/* ---------- Off-canvas menu panel (header hamburger, all pages) ---------- */

function toggleOffcanvas() {
  const panel = document.getElementById("offcanvasMenu");
  const backdrop = document.getElementById("offcanvasBackdrop");
  if (!panel || !backdrop) return;
  const opening = !panel.classList.contains("show");
  panel.classList.toggle("show", opening);
  backdrop.classList.toggle("show", opening);
  document.body.classList.toggle("oc-lock", opening);
  const btn = document.getElementById("menuBtn");
  if (btn) btn.setAttribute("aria-expanded", opening ? "true" : "false");
}

function closeOffcanvas() {
  const panel = document.getElementById("offcanvasMenu");
  const backdrop = document.getElementById("offcanvasBackdrop");
  if (!panel || !backdrop) return;
  panel.classList.remove("show");
  backdrop.classList.remove("show");
  document.body.classList.remove("oc-lock");
  const btn = document.getElementById("menuBtn");
  if (btn) btn.setAttribute("aria-expanded", "false");
}

/* Category links inside the panel work from any page: on index.html they
   filter in place, everywhere else they follow the href to
   index.html#<cat> where render.js picks the hash up on load. */
function handleOcCategory(cat, evt) {
  if (typeof jumpToCat === "function") {
    if (evt) evt.preventDefault();
    jumpToCat(cat);
    closeOffcanvas();
    return false;
  }
  closeOffcanvas();
  return true;
}

/* Same as handleOcCategory() but for the Student Exams links, which point
   at examdates.html#<cat> instead of index.html#<cat>. */
function handleOcExamCategory(cat, evt) {
  if (typeof jumpToExamCat === "function") {
    if (evt) evt.preventDefault();
    jumpToExamCat(cat);
    closeOffcanvas();
    return false;
  }
  closeOffcanvas();
  return true;
}

/* Highlights whichever panel link matches the current page and wires up
   the backdrop click / Esc-to-close behaviour. Runs on every page since
   common.js is shared. */
document.addEventListener("DOMContentLoaded", function () {
  const backdrop = document.getElementById("offcanvasBackdrop");
  if (backdrop) backdrop.addEventListener("click", closeOffcanvas);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeOffcanvas();
  });

  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".oc-link[data-page]").forEach(function (a) {
    if (a.getAttribute("data-page") === here) a.classList.add("oc-cur");
  });

  const themeSwitch = document.getElementById("ocThemeSwitch");
  if (themeSwitch) {
    themeSwitch.addEventListener("click", toggleTheme);
  }
});

/* ---------- Notification bell (masthead, every page) ----------
   Reads notifications.json (same fetch pattern as jobs.json /
   results.json / admitcards.json) and renders it into the dropdown
   below the bell icon. To publish a new notice later, just add a new
   object to the top of notifications.json — no code changes needed:

   { "id": "n002", "type": "info", "title": "...", "message": "...",
     "date": "2026-09-20", "link": "jobs.html" }

   "type" controls the icon/colour: "info" | "alert" | "success" | "job".
   "link" is optional — omit it for a plain announcement. */

const NOTIF_ICON_META = {
  info:    { icon: "fa-circle-info",         color: "#38bdf8" },
  alert:   { icon: "fa-triangle-exclamation", color: "#ff7f50" },
  success: { icon: "fa-circle-check",        color: "#0ac16c" },
  job:     { icon: "fa-briefcase",           color: "#b060ff" },
};

function notifMetaFor(type) {
  return NOTIF_ICON_META[type] || { icon: "fa-bell", color: "#0ac16c" };
}

function formatNotifDate(dateStr) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr || "";
  return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
}

function buildNotifItem(n) {
  const meta = notifMetaFor(n.type);
  const tag = n.link ? "a" : "div";
  const hrefAttr = n.link ? `href="${n.link}"` : "";
  const targetAttr = n.link && /^https?:\/\//i.test(n.link) ? 'target="_blank" rel="noopener"' : "";
  return `
    <${tag} class="notif-item" ${hrefAttr} ${targetAttr}>
      <div class="notif-ico" style="background:${meta.color}1a;border:1px solid ${meta.color}40;color:${meta.color}"><i class="fa-solid ${meta.icon}"></i></div>
      <div class="notif-body">
        <div class="notif-title">${n.title || ""}</div>
        <div class="notif-msg">${n.message || ""}</div>
        <div class="notif-date"><i class="fa-regular fa-clock"></i> ${formatNotifDate(n.date)}</div>
      </div>
    </${tag}>`;
}

async function initNotifications() {
  const listEl = document.getElementById("notifList");
  const countEl = document.getElementById("notifCount");
  const dotEl = document.getElementById("notifDot");
  if (!listEl) return;

  let items = [];
  try {
    const res = await fetch("notifications.json?_=" + Date.now());
    items = await res.json();
  } catch (e) {
    console.error("Could not load notifications.json", e);
    items = [];
  }

  if (!Array.isArray(items) || items.length === 0) {
    listEl.innerHTML = '<div class="notif-empty"><i class="fa-regular fa-bell-slash"></i>No notifications right now</div>';
    if (countEl) countEl.textContent = "0";
    if (dotEl) dotEl.style.display = "none";
    return;
  }

  listEl.innerHTML = items.map(buildNotifItem).join("");
  if (countEl) countEl.textContent = String(items.length);
  if (dotEl) dotEl.style.display = "block";
}

function toggleNotifPanel(evt) {
  if (evt) evt.stopPropagation();
  const panel = document.getElementById("notifPanel");
  const btn = document.getElementById("notifBtn");
  if (!panel) return;
  const opening = !panel.classList.contains("show");
  panel.classList.toggle("show", opening);
  if (btn) btn.setAttribute("aria-expanded", opening ? "true" : "false");
}

function closeNotifPanel() {
  const panel = document.getElementById("notifPanel");
  const btn = document.getElementById("notifBtn");
  if (!panel) return;
  panel.classList.remove("show");
  if (btn) btn.setAttribute("aria-expanded", "false");
}

document.addEventListener("DOMContentLoaded", initNotifications);

document.addEventListener("click", function (e) {
  const wrap = document.querySelector(".notif-wrap");
  if (wrap && !wrap.contains(e.target)) closeNotifPanel();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closeNotifPanel();
});

function setMobileNavAct(el) {
  document.querySelectorAll(".mn-item").forEach(function (i) {
    i.classList.remove("act");
  });
  el.classList.add("act");
}

window.addEventListener("scroll", function () {
  const btt = document.getElementById("backToTop");
  if (!btt) return;
  if (window.scrollY > 400) btt.classList.add("visible");
  else btt.classList.remove("visible");
});

/* ---------- Live header clock (topbar date + ticking time) ---------- */

function updateHeaderTime() {
  const el = document.getElementById("tbDate");
  if (!el) return;
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = days[d.getDay()] + " · " + pad(d.getDate()) + " " + months[d.getMonth()] + " " + d.getFullYear();
  const timeStr = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  el.textContent = dateStr + " · " + timeStr;
}
updateHeaderTime();
setInterval(updateHeaderTime, 1000);

/* ---------- Animated counters (mast stats) ---------- */

(function () {
  const counters = document.querySelectorAll(".counter");
  if (!counters.length) return;
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute("data-target"));
          if (isNaN(target)) return;
          const suffix = el.textContent.replace(/[0-9]/g, "");
          let current = 0;
          const increment = target / 40;
          const timer = setInterval(function () {
            current += increment;
            if (current >= target) {
              el.textContent = target + suffix;
              clearInterval(timer);
            } else {
              el.textContent = Math.floor(current) + suffix;
            }
          }, 30);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach(function (c) {
    observer.observe(c);
  });
})();
