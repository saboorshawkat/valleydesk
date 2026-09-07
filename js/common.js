/* Valley Desk — shared logic used on every page (index.html, jobs.html,
   results.html, admitcards.html): theme toggle, live header clock,
   category metadata + card builders, and a small pagination helper. */

/* ---------- Category metadata (with a fallback for anything new) ---------- */

const CATEGORY_META = {
  jkssb:        { icon: "📋", title: "JKSSB Recruitment",         desc: "J&K Services Selection Board",              color: "#0ac16c" },
  jkpsc:        { icon: "⚖️", title: "JKPSC Recruitment",         desc: "Jammu & Kashmir Public Service Commission", color: "#34d399" },
  jkpolice:     { icon: "👮", title: "JK Police Recruitment",     desc: "Jammu & Kashmir Police Department",         color: "#ff7f50" },
  jkbank:       { icon: "🏦", title: "J&K Bank Recruitment",      desc: "Jammu & Kashmir Bank Ltd",                  color: "#f5c518" },
  jkjudiciary:  { icon: "🏛️", title: "JK Judiciary Recruitment",  desc: "J&K High Court & District Courts",          color: "#38bdf8" },
  jkteaching:   { icon: "📘", title: "JK Teaching Recruitment",   desc: "School Education Department, J&K",          color: "#25d366" },
  jkhealth:     { icon: "🩺", title: "JK Health Dept Recruitment", desc: "SKIMS, GMC & Directorate of Health Services", color: "#fb923c" },
  jkuniversity: { icon: "🎓", title: "JK University Recruitment", desc: "University of Kashmir & University of Jammu", color: "#e879f9" },
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
