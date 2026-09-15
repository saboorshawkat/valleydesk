/* Valley Desk — tools.js
   Powers tools.html: everything below runs 100% client-side (Canvas
   API + <input type="file">) — no file is ever uploaded anywhere. */

function fmtBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(kb < 10 ? 1 : 0) + " KB";
  return (kb / 1024).toFixed(2) + " MB";
}

function readFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function wireDropzone(zoneId, inputId, onFile) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;
  zone.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    if (input.files && input.files[0]) onFile(input.files[0]);
  });
  ["dragover", "dragenter"].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.add("dragover");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.remove("dragover");
    })
  );
  zone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) onFile(file);
  });
}

/* ---------- Photo & Signature Compressor ---------- */

function initCompressor() {
  const body = document.getElementById("compressorBody");
  const beforeImg = document.getElementById("compressBeforeImg");
  const afterImg = document.getElementById("compressAfterImg");
  const beforeSize = document.getElementById("compressBeforeSize");
  const afterSize = document.getElementById("compressAfterSize");
  const targetSlider = document.getElementById("compressTargetKb");
  const targetVal = document.getElementById("compressTargetKbVal");
  const savings = document.getElementById("compressSavings");
  const downloadBtn = document.getElementById("compressDownloadBtn");
  const resetBtn = document.getElementById("compressResetBtn");
  if (!body) return;

  let originalFile = null;
  let originalImg = null;
  let compressedBlobUrl = null;

  function compressToTarget(img, targetKb) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    let scale = 1;
    let quality = 0.92;
    let attempt = 0;
    const targetBytes = targetKb * 1024;

    function render() {
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", quality);
    }

    let dataUrl = render();
    let sizeBytes = Math.round((dataUrl.length - "data:image/jpeg;base64,".length) * 0.75);

    // Step 1: lower JPEG quality first (keeps dimensions intact as long as possible)
    while (sizeBytes > targetBytes && quality > 0.1 && attempt < 25) {
      quality -= 0.07;
      dataUrl = render();
      sizeBytes = Math.round((dataUrl.length - "data:image/jpeg;base64,".length) * 0.75);
      attempt++;
    }

    // Step 2: if still too big, start scaling the image down too
    attempt = 0;
    while (sizeBytes > targetBytes && scale > 0.1 && attempt < 25) {
      scale -= 0.08;
      dataUrl = render();
      sizeBytes = Math.round((dataUrl.length - "data:image/jpeg;base64,".length) * 0.75);
      attempt++;
    }

    return { dataUrl, sizeBytes, width: canvas.width, height: canvas.height };
  }

  function runCompression() {
    if (!originalImg) return;
    const targetKb = parseInt(targetSlider.value, 10);
    const result = compressToTarget(originalImg, targetKb);
    afterImg.src = result.dataUrl;
    afterSize.textContent = fmtBytes(result.sizeBytes) + " · " + result.width + "×" + result.height;

    if (compressedBlobUrl) URL.revokeObjectURL(compressedBlobUrl);
    const byteStr = atob(result.dataUrl.split(",")[1]);
    const bytes = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: "image/jpeg" });
    compressedBlobUrl = URL.createObjectURL(blob);
    downloadBtn.href = compressedBlobUrl;
    downloadBtn.setAttribute("download", "compressed-" + (originalFile ? originalFile.name.replace(/\.[^.]+$/, "") : "image") + ".jpg");

    const savedPct = originalFile ? Math.max(0, Math.round((1 - result.sizeBytes / originalFile.size) * 100)) : 0;
    savings.style.display = "flex";
    savings.innerHTML = '<i class="fa fa-circle-check"></i> ' + savedPct + "% Smaller — Ready To Download";
  }

  wireDropzone("compressDropzone", "compressFileInput", async (file) => {
    originalFile = file;
    originalImg = await readFileAsImage(file);
    beforeImg.src = originalImg.src;
    beforeSize.textContent = fmtBytes(file.size) + " · " + originalImg.width + "×" + originalImg.height;
    body.classList.add("active");
    runCompression();
    showToast("Photo loaded — nothing was uploaded anywhere");
  });

  if (targetSlider) {
    targetSlider.addEventListener("input", () => {
      targetVal.textContent = targetSlider.value;
      runCompression();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      body.classList.remove("active");
      document.getElementById("compressFileInput").value = "";
      originalFile = null;
      originalImg = null;
      savings.style.display = "none";
    });
  }
}

/* ---------- Image Resizer ---------- */

function initResizer() {
  const body = document.getElementById("resizerBody");
  const beforeImg = document.getElementById("resizeBeforeImg");
  const afterImg = document.getElementById("resizeAfterImg");
  const beforeSize = document.getElementById("resizeBeforeSize");
  const afterSize = document.getElementById("resizeAfterSize");
  const widthInput = document.getElementById("resizeWidth");
  const heightInput = document.getElementById("resizeHeight");
  const lockRatio = document.getElementById("resizeLockRatio");
  const downloadBtn = document.getElementById("resizeDownloadBtn");
  const resetBtn = document.getElementById("resizeResetBtn");
  if (!body) return;

  let originalImg = null;
  let originalFile = null;
  let ratio = 1;
  let resizedBlobUrl = null;

  function runResize() {
    if (!originalImg) return;
    const w = Math.max(1, parseInt(widthInput.value, 10) || 1);
    const h = Math.max(1, parseInt(heightInput.value, 10) || 1);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(originalImg, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    afterImg.src = dataUrl;
    afterSize.textContent = w + "×" + h;

    if (resizedBlobUrl) URL.revokeObjectURL(resizedBlobUrl);
    const byteStr = atob(dataUrl.split(",")[1]);
    const bytes = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: "image/jpeg" });
    resizedBlobUrl = URL.createObjectURL(blob);
    downloadBtn.href = resizedBlobUrl;
    downloadBtn.setAttribute("download", "resized-" + (originalFile ? originalFile.name.replace(/\.[^.]+$/, "") : "image") + ".jpg");
  }

  wireDropzone("resizeDropzone", "resizeFileInput", async (file) => {
    originalFile = file;
    originalImg = await readFileAsImage(file);
    ratio = originalImg.width / originalImg.height;
    beforeImg.src = originalImg.src;
    beforeSize.textContent = originalImg.width + "×" + originalImg.height;
    widthInput.value = originalImg.width;
    heightInput.value = originalImg.height;
    body.classList.add("active");
    runResize();
    showToast("Image loaded — nothing was uploaded anywhere");
  });

  if (widthInput) {
    widthInput.addEventListener("input", () => {
      if (lockRatio && lockRatio.checked && ratio) {
        heightInput.value = Math.round(parseInt(widthInput.value, 10) / ratio) || heightInput.value;
      }
      runResize();
    });
  }
  if (heightInput) {
    heightInput.addEventListener("input", () => {
      if (lockRatio && lockRatio.checked && ratio) {
        widthInput.value = Math.round(parseInt(heightInput.value, 10) * ratio) || widthInput.value;
      }
      runResize();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      body.classList.remove("active");
      document.getElementById("resizeFileInput").value = "";
      originalImg = null;
      originalFile = null;
    });
  }
}

/* ---------- Percentage & Aggregate Calculator ---------- */

function initPercentCalc() {
  const btn = document.getElementById("percentCalcBtn");
  const result = document.getElementById("percentResult");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const obtained = parseFloat(document.getElementById("percentObtained").value);
    const total = parseFloat(document.getElementById("percentTotal").value);
    if (!total || isNaN(obtained) || isNaN(total) || total <= 0) {
      result.style.display = "flex";
      result.innerHTML = '<i class="fa fa-triangle-exclamation"></i> Enter Valid Marks Obtained &amp; Total Marks';
      return;
    }
    const pct = (obtained / total) * 100;
    result.style.display = "flex";
    result.innerHTML = '<i class="fa fa-circle-check"></i> ' + pct.toFixed(2) + "% (" + obtained + " Out Of " + total + ")";
  });
}

/* ---------- Age Calculator ---------- */

function initAgeCalc() {
  const btn = document.getElementById("ageCalcBtn");
  const result = document.getElementById("ageResult");
  const asOnInput = document.getElementById("ageAsOn");
  if (!btn) return;

  if (asOnInput && !asOnInput.value) {
    const today = new Date();
    asOnInput.value = today.toISOString().slice(0, 10);
  }

  btn.addEventListener("click", () => {
    const dobVal = document.getElementById("ageDob").value;
    const asOnVal = document.getElementById("ageAsOn").value;
    if (!dobVal || !asOnVal) {
      result.style.display = "flex";
      result.innerHTML = '<i class="fa fa-triangle-exclamation"></i> Pick Both Date Of Birth &amp; Age-As-On Date';
      return;
    }
    const dob = new Date(dobVal);
    const asOn = new Date(asOnVal);
    if (dob > asOn) {
      result.style.display = "flex";
      result.innerHTML = '<i class="fa fa-triangle-exclamation"></i> Date Of Birth Must Be Before The Age-As-On Date';
      return;
    }
    let years = asOn.getFullYear() - dob.getFullYear();
    let months = asOn.getMonth() - dob.getMonth();
    let days = asOn.getDate() - dob.getDate();
    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(asOn.getFullYear(), asOn.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    result.style.display = "flex";
    result.innerHTML =
      '<i class="fa fa-cake-candles"></i> ' + years + " Years, " + months + " Months, " + days + " Days";
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initCompressor();
  initResizer();
  initPercentCalc();
  initAgeCalc();
});
