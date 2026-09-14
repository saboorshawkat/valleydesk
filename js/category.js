/* Valley Desk — category.js
   Drives every category page (jkbose.html, jkbopee.html, jkssb.html,
   jkpsc.html, neet.html, jee.html, kashmir-university.html,
   central-university.html, cuet.html). The page tells this script who
   it is via <body data-entity="jkssb">; everything else — hero copy,
   accent colour, and which of the 5 sections to show — comes from
   fetching that ONE category's own JSON file: json/<entity>.json.
   That file already carries { meta, notifications, examdates,
   admitcards, results, studymaterial } for that category alone, so
   there's no client-side filtering of a shared/global dataset. */

const STUDY_TYPE_META = {
  notes: { label: "Notes", icon: "fa-note-sticky" },
  pyq: { label: "Previous Year Papers", icon: "fa-layer-group" },
  syllabus: { label: "Syllabus", icon: "fa-list-check" },
  book: { label: "Books", icon: "fa-book" },
};

function studyTypeMeta(type) {
  return STUDY_TYPE_META[type] || { label: "Material", icon: "fa-file" };
}

async function initCategoryPage() {
  const entity = document.body.getAttribute("data-entity");
  if (!entity) return;

  let data;
  try {
    const res = await fetch("json/" + entity + ".json?_=" + Date.now());
    data = await res.json();
  } catch (e) {
    console.error("Could not load json/" + entity + ".json", e);
    return;
  }

  paintHero(data.meta || {});

  const counts = {
    notifications: renderNotifSection(data.notifications || []),
    examdates: renderExamSection(data.examdates || []),
    admitcards: renderAdmitSection(data.admitcards || []),
    results: renderResultSection(data.results || []),
    studymaterial: renderStudySection(data.studymaterial || []),
  };

  paintQuickNav(counts);
}

/* ---------- Hero ---------- */

function paintHero(meta) {
  const iconEl = document.getElementById("entityIcon");
  const titleEl = document.getElementById("entityTitle");
  const fullTitleEl = document.getElementById("entityFullTitle");
  const descEl = document.getElementById("entityDesc");
  const tagEl = document.getElementById("entityTag");
  const crumbEl = document.getElementById("entityCrumb");
  const officialEl = document.getElementById("entityOfficialLink");

  if (iconEl) iconEl.textContent = meta.icon || "📌";
  if (titleEl) titleEl.textContent = meta.title || "";
  if (fullTitleEl) fullTitleEl.textContent = meta.fullTitle || meta.title || "";
  if (descEl) descEl.textContent = meta.desc || "";
  if (tagEl) tagEl.textContent = meta.tag || "";
  if (crumbEl) crumbEl.textContent = meta.crumb || meta.title || "";
  if (officialEl && meta.officialLink) officialEl.setAttribute("href", meta.officialLink);

  document.querySelectorAll(".entity-accent").forEach((el) => {
    el.style.setProperty("--accent", meta.color || "#0ac16c");
  });
}

/* ---------- Section helpers ---------- */

function showOrEmpty(sectionId, hasItems, emptyMsg) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const emptyEl = section.querySelector(".entity-empty-slot");
  if (emptyEl) emptyEl.innerHTML = hasItems ? "" : `<div class="entity-empty"><i class="fa-regular fa-folder-open"></i>${emptyMsg}</div>`;
}

/* ---------- Notifications / Recruitment (job-card style) ---------- */

function buildNotifCard(job) {
  const badges = (job.badges || []).map((b) => `<span class="tcb ${b.cls}">${b.label}</span>`).join("");
  return `
    <div class="tool-card" data-name="${escapeAttr(job.name)}">
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

function renderNotifSection(items) {
  const slot = document.getElementById("entityNotifList");
  const countEl = document.getElementById("entityNotifCount");
  const section = document.getElementById("entityNotifSection");
  if (countEl) countEl.textContent = items.length;
  if (!items.length) {
    if (section) section.style.display = "none";
    return 0;
  }
  if (section) section.style.display = "";
  if (slot) slot.innerHTML = items.map(buildNotifCard).join("");
  return items.length;
}

/* ---------- Exam dates ---------- */

function buildExamCard(item) {
  const badges = (item.badges || []).map((b) => `<span class="tcb ${b.cls}">${b.label}</span>`).join("");
  const hasExamDate = item.examDate && item.examDate !== "--/--/----";
  const hasLastDate = item.lastDate && item.lastDate !== "--/--/----";
  const dates =
    (hasExamDate ? `<span class="tc-date tc-date-start"><i class="fa fa-calendar-check"></i> Exam Date: ${item.examDate}</span>` : "") +
    (hasLastDate ? `<span class="tc-date tc-date-reg"><i class="fa fa-calendar-xmark"></i> Last Date To Apply: ${item.lastDate}</span>` : "");
  return `
    <div class="tool-card" data-name="${escapeAttr(item.name)}">
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

function renderExamSection(items) {
  const slot = document.getElementById("entityExamList");
  const countEl = document.getElementById("entityExamCount");
  const section = document.getElementById("entityExamSection");
  if (countEl) countEl.textContent = items.length;
  if (!items.length) {
    if (section) section.style.display = "none";
    return 0;
  }
  if (section) section.style.display = "";
  if (slot) slot.innerHTML = items.map(buildExamCard).join("");
  return items.length;
}

/* ---------- Admit cards ---------- */

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

function renderAdmitSection(items) {
  const slot = document.getElementById("entityAdmitList");
  const countEl = document.getElementById("entityAdmitCount");
  const section = document.getElementById("entityAdmitSection");
  if (countEl) countEl.textContent = items.length;
  if (!items.length) {
    if (section) section.style.display = "none";
    return 0;
  }
  if (section) section.style.display = "";
  if (slot) slot.innerHTML = items.map(buildAdmitCard).join("");
  return items.length;
}

/* ---------- Results ---------- */

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

function renderResultSection(items) {
  const slot = document.getElementById("entityResultList");
  const countEl = document.getElementById("entityResultCount");
  const section = document.getElementById("entityResultSection");
  if (countEl) countEl.textContent = items.length;
  if (!items.length) {
    if (section) section.style.display = "none";
    return 0;
  }
  if (section) section.style.display = "";
  if (slot) slot.innerHTML = items.map(buildResultCard).join("");
  return items.length;
}

/* ---------- Study material — the deliberately different treatment:
   a document-style card grid grouped into tabs by type instead of the
   plain list used for notifications/admit-cards/results/exam-dates. ---------- */

function buildStudyCard(item) {
  const meta = studyTypeMeta(item.type);
  const isPyq = item.type === "pyq";
  const iconInner = isPyq
    ? `<div class="pyq-stack"><span class="pyq-sheet"></span><span class="pyq-sheet"></span><span class="pyq-sheet"><i class="fa-solid ${meta.icon}"></i></span></div>`
    : `<i class="fa-solid ${meta.icon}"></i>`;
  const chips =
    (item.year ? `<span class="study-meta-chip"><i class="fa fa-calendar"></i> ${item.year}</span>` : "") +
    (item.size ? `<span class="study-meta-chip"><i class="fa fa-file"></i> ${item.size}</span>` : "");
  return `
    <div class="study-card ${isPyq ? "is-pyq" : ""}" data-study-type="${item.type || "other"}" data-name="${escapeAttr(item.name)}">
      <div class="study-card-head">
        <div class="study-doc-ico">${iconInner}</div>
        <span class="study-type-pill">${meta.label}</span>
        <div class="study-card-fold"></div>
      </div>
      <div class="study-card-body">
        <div class="study-name">${item.name}</div>
        <div class="study-sub">${item.subtitle || ""}</div>
        <div class="study-desc">${item.desc || ""}</div>
        <div class="study-meta-row">${chips}</div>
        <div class="study-card-actions">
          <a href="${item.downloadLink || "#"}" class="study-btn study-btn-dl" target="_blank"><i class="fa fa-download"></i> Download</a>
          <a href="${item.viewLink || item.downloadLink || "#"}" class="study-btn study-btn-view" target="_blank"><i class="fa fa-eye"></i> View</a>
        </div>
      </div>
    </div>`;
}

function renderStudySection(items) {
  const tabsEl = document.getElementById("entityStudyTabs");
  const gridEl = document.getElementById("entityStudyGrid");
  const countEl = document.getElementById("entityStudyCount");
  const section = document.getElementById("entityStudySection");
  if (countEl) countEl.textContent = items.length;

  if (!items.length) {
    if (section) section.style.display = "none";
    return 0;
  }
  if (section) section.style.display = "";

  const byType = {};
  items.forEach((it) => {
    const t = it.type || "other";
    (byType[t] = byType[t] || []).push(it);
  });

  const typeOrder = Object.keys(STUDY_TYPE_META).filter((t) => byType[t]).concat(Object.keys(byType).filter((t) => !STUDY_TYPE_META[t]));

  if (tabsEl) {
    let tabsHtml = `<div class="study-tab act" data-study-filter="all"><i class="fa-solid fa-grip"></i> All <span class="study-tab-n">${items.length}</span></div>`;
    typeOrder.forEach((t) => {
      const meta = studyTypeMeta(t);
      tabsHtml += `<div class="study-tab" data-study-filter="${t}"><i class="fa-solid ${meta.icon}"></i> ${meta.label} <span class="study-tab-n">${byType[t].length}</span></div>`;
    });
    tabsEl.innerHTML = tabsHtml;
    tabsEl.querySelectorAll(".study-tab").forEach((tab) => {
      tab.addEventListener("click", function () {
        tabsEl.querySelectorAll(".study-tab").forEach((t) => t.classList.remove("act"));
        this.classList.add("act");
        const filter = this.getAttribute("data-study-filter");
        gridEl.querySelectorAll(".study-card").forEach((card) => {
          card.style.display = filter === "all" || card.getAttribute("data-study-type") === filter ? "" : "none";
        });
      });
    });
  }

  if (gridEl) gridEl.innerHTML = items.map(buildStudyCard).join("");
  return items.length;
}

/* ---------- Quick-nav chips under the hero (jump + live counts) ---------- */

function paintQuickNav(counts) {
  const map = {
    entityNotifCountChip: counts.notifications,
    entityExamCountChip: counts.examdates,
    entityAdmitCountChip: counts.admitcards,
    entityResultCountChip: counts.results,
    entityStudyCountChip: counts.studymaterial,
  };
  Object.keys(map).forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const chip = el.closest(".eqn-chip");
    el.textContent = map[id];
    if (chip && !map[id]) chip.style.display = "none";
  });
}

document.addEventListener("DOMContentLoaded", initCategoryPage);
