/* Valley Desk — entrance-exams.html: JKBOSE (10th/11th/12th combined),
   NEET, JEE Main/Advanced and JKBOPEE CET shown together, filterable by
   a single strip. JKBOSE items are split into three filter keys
   (jkbose-10/11/12) using the "level" field added to examdates.json /
   studymaterial.json; every other exam filters on category alone. */

const ENTRANCE_CATS = ["jkbose", "neet", "jee", "jkbopee"];

const entranceState = { exams: [], study: [], filter: "all" };

/* Builds the same "jkbose-10" style key used by the filter strip, for
   both exam-date and study-material items. */
function entranceKey(item) {
  return item.category === "jkbose" ? `jkbose-${item.level || "12"}` : item.category;
}

async function initEntrancePage() {
  const [exams, study] = await Promise.all([
    fetch("examdates.json?_=" + Date.now()).then((r) => r.json()).catch(() => []),
    fetch("studymaterial.json?_=" + Date.now()).then((r) => r.json()).catch(() => []),
  ]);

  entranceState.exams = exams.filter((e) => ENTRANCE_CATS.includes(e.category));
  entranceState.study = study.filter((m) => ENTRANCE_CATS.includes(m.category));

  const hashCat = (window.location.hash || "").replace("#", "");
  if (hashCat) entranceState.filter = hashCat;

  document.querySelectorAll("#catStrip .cs-btn").forEach((btn) => {
    if (btn.getAttribute("data-cat") === entranceState.filter) btn.classList.add("act");
    else if (entranceState.filter !== "all") btn.classList.remove("act");
    btn.addEventListener("click", () => {
      entranceState.filter = btn.getAttribute("data-cat");
      document.querySelectorAll("#catStrip .cs-btn").forEach((b) => b.classList.toggle("act", b === btn));
      renderEntrancePage();
    });
  });

  renderEntrancePage();
}

function renderEntrancePage() {
  const f = entranceState.filter;
  const exams = f === "all" ? entranceState.exams : entranceState.exams.filter((e) => entranceKey(e) === f);
  const study = f === "all" ? entranceState.study : entranceState.study.filter((m) => entranceKey(m) === f);

  const examSlot = document.getElementById("examListSlot");
  const studySlot = document.getElementById("examStudySlot");
  const noResults = document.getElementById("noResults");
  const totalChip = document.getElementById("examTotalChip");

  if (totalChip) totalChip.textContent = `${entranceState.exams.length} Tracked`;

  if (examSlot) {
    examSlot.innerHTML = exams.map(buildExamCard).join("");
  }
  if (noResults) noResults.style.display = exams.length ? "none" : "block";
  if (studySlot) {
    studySlot.innerHTML = study.length
      ? study.map(buildStudyCard).join("")
      : `<p style="color:var(--t3);font-size:10px;padding:10px 0">No study material filed under this exam yet.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", initEntrancePage);
