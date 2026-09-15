/* Valley Desk — common.js
   Shared logic used on EVERY page (index.html + all 9 category pages +
   about/contact/legal pages): theme toggle, off-canvas menu, live header
   clock, toasts, the notification bell (json/notifications.json), the
   mobile bottom nav, and the animated masthead counters.
   Page-specific data rendering lives in js/category.js (category pages)
   and js/home.js (index.html). */

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;").toLowerCase();
}

/* ---------- Accent colour contrast fix ----------
   Several category brand colours (JKSSB yellow, JKPSC mint, JEE sky
   blue, University of Kashmir pink, Central University lavender,
   CUET orange, JKBOPEE purple) are too light to use as plain text on
   a white card or as a background under white button text — they sit
   below ~4:1 contrast. getAccentStrong() darkens a colour toward
   black just enough to clear that bar, and leaves already-dark
   colours (NEET red, JKBOSE green) untouched. Used for TEXT/BADGE
   colour only — icon tints and low-opacity backgrounds keep using the
   original bright brand colour. */
function getAccentStrong(hex) {
  hex = (hex || "#e8590c").replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);
  const lum = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  const contrastVsWhite = (rr, gg, bb) => (1.05) / (relLum(rr, gg, bb) + 0.05);
  let amt = 0;
  while (amt < 0.8 && contrastVsWhite(r * (1 - amt), g * (1 - amt), b * (1 - amt)) < 4.0) {
    amt += 0.02;
  }
  const nr = Math.round(r * (1 - amt));
  const ng = Math.round(g * (1 - amt));
  const nb = Math.round(b * (1 - amt));
  const toHex = (v) => v.toString(16).padStart(2, "0");
  return "#" + toHex(nr) + toHex(ng) + toHex(nb);
}

/* ---------- Theme (light / dark) ---------- */

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

/* ---------- Toasts ---------- */

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
   Reads json/notifications.json. To publish a new notice later, just add
   a new object to the top of the array — no code changes needed:

   { "id": "n010", "type": "info", "title": "...", "message": "...",
     "date": "2026-09-20", "link": "jkssb.html" }

   "type" controls the icon/colour: "info" | "alert" | "success" | "job". */

const NOTIF_ICON_META = {
  info: { icon: "fa-circle-info", color: "#b5622f" },
  alert: { icon: "fa-triangle-exclamation", color: "#ff7f50" },
  success: { icon: "fa-circle-check", color: "#e8590c" },
  job: { icon: "fa-briefcase", color: "#c2410c" },
};

function notifMetaFor(type) {
  return NOTIF_ICON_META[type] || { icon: "fa-bell", color: "#e8590c" };
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
    const res = await fetch("json/notifications.json?_=" + Date.now());
    items = await res.json();
  } catch (e) {
    console.error("Could not load json/notifications.json", e);
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

/* The masthead uses backdrop-filter, which (per spec) makes it the
   containing block for any position:fixed descendant. On mobile the
   notif panel switches to position:fixed so it can dock as a bottom
   sheet — but without this fix it would be positioned relative to the
   ~60px-tall masthead instead of the real viewport and render almost
   entirely off-screen above the page. Moving the panel to <body> while
   it's open sidesteps that and keeps desktop's absolute-positioned
   dropdown (anchored to .notif-wrap) untouched. */
let notifHomeParent = null;

function isMobileNotifLayout() {
  return window.matchMedia("(max-width: 480px)").matches;
}

function returnNotifPanelHome(panel) {
  if (notifHomeParent && !panel.classList.contains("show")) {
    notifHomeParent.appendChild(panel);
    notifHomeParent = null;
  }
}

function toggleNotifPanel(evt) {
  if (evt) evt.stopPropagation();
  const panel = document.getElementById("notifPanel");
  const btn = document.getElementById("notifBtn");
  const wrap = document.querySelector(".notif-wrap");
  if (!panel || !wrap) return;
  const opening = !panel.classList.contains("show");

  if (opening && isMobileNotifLayout() && panel.parentElement !== document.body) {
    notifHomeParent = wrap;
    document.body.appendChild(panel);
  }

  panel.classList.toggle("show", opening);
  if (btn) btn.setAttribute("aria-expanded", opening ? "true" : "false");

  if (!opening) setTimeout(function () { returnNotifPanelHome(panel); }, 220);
}

function closeNotifPanel() {
  const panel = document.getElementById("notifPanel");
  const btn = document.getElementById("notifBtn");
  if (!panel || !panel.classList.contains("show")) return;
  panel.classList.remove("show");
  if (btn) btn.setAttribute("aria-expanded", "false");
  setTimeout(function () { returnNotifPanelHome(panel); }, 220);
}

document.addEventListener("DOMContentLoaded", initNotifications);

document.addEventListener("click", function (e) {
  const wrap = document.querySelector(".notif-wrap");
  const panel = document.getElementById("notifPanel");
  const insideWrap = wrap && wrap.contains(e.target);
  const insidePanel = panel && panel.contains(e.target);
  if (!insideWrap && !insidePanel) closeNotifPanel();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closeNotifPanel();
});

/* ---------- Mobile bottom nav + back-to-top ---------- */

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
