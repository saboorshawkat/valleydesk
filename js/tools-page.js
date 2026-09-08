/* Valley Desk — Tools page: Image Compressor
   Everything happens client-side with the Canvas API. The chosen photo is
   never uploaded anywhere; it's just read into memory, redrawn at a smaller
   size/quality, and offered back as a download. */

(function () {
  const dropzone = document.getElementById("dropzone");
  const imgInput = document.getElementById("imgInput");
  const compressorBody = document.getElementById("compressorBody");
  const qualityRange = document.getElementById("qualityRange");
  const qualityVal = document.getElementById("qualityVal");
  const widthRange = document.getElementById("widthRange");
  const widthVal = document.getElementById("widthVal");
  const originalPreview = document.getElementById("originalPreview");
  const compressedPreview = document.getElementById("compressedPreview");
  const originalSize = document.getElementById("originalSize");
  const compressedSize = document.getElementById("compressedSize");
  const compressSavings = document.getElementById("compressSavings");
  const downloadBtn = document.getElementById("downloadBtn");
  const resetBtn = document.getElementById("resetBtn");

  if (!dropzone || !imgInput) return; // not on this page

  let sourceImage = null;
  let originalBytes = 0;
  let originalFileName = "image";

  function formatBytes(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    return Math.round(bytes / 1024) + " KB";
  }

  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Please choose an image file");
      return;
    }
    originalBytes = file.size;
    originalFileName = (file.name || "image").replace(/\.[^.]+$/, "");

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        sourceImage = img;
        originalPreview.src = e.target.result;
        originalSize.textContent = formatBytes(originalBytes);
        compressorBody.classList.add("active");
        widthRange.max = Math.max(img.width, 2000);
        widthRange.value = Math.min(img.width, 1000);
        widthVal.textContent = widthRange.value + "px";
        runCompression();
        compressorBody.scrollIntoView({ behavior: "smooth", block: "nearest" });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function runCompression() {
    if (!sourceImage) return;
    const quality = parseInt(qualityRange.value, 10) / 100;
    const maxWidth = parseInt(widthRange.value, 10);
    const scale = Math.min(1, maxWidth / sourceImage.width);
    const w = Math.max(1, Math.round(sourceImage.width * scale));
    const h = Math.max(1, Math.round(sourceImage.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(sourceImage, 0, 0, w, h);

    canvas.toBlob(
      function (blob) {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        compressedPreview.src = url;
        compressedSize.textContent = formatBytes(blob.size);

        const reduction = originalBytes > 0 ? Math.max(0, Math.round((1 - blob.size / originalBytes) * 100)) : 0;
        compressSavings.innerHTML =
          '<i class="fa fa-circle-check"></i> ' +
          (reduction > 0
            ? reduction + "% smaller — " + formatBytes(originalBytes) + " → " + formatBytes(blob.size)
            : "This photo is already small — try a lower quality for more savings");

        downloadBtn.href = url;
        downloadBtn.setAttribute("download", originalFileName + "-compressed.jpg");
      },
      "image/jpeg",
      quality
    );
  }

  dropzone.addEventListener("click", function () {
    imgInput.click();
  });
  dropzone.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      imgInput.click();
    }
  });

  dropzone.addEventListener("dragover", function (e) {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });
  dropzone.addEventListener("dragleave", function () {
    dropzone.classList.remove("dragover");
  });
  dropzone.addEventListener("drop", function (e) {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  });

  imgInput.addEventListener("change", function () {
    if (imgInput.files && imgInput.files[0]) loadFile(imgInput.files[0]);
  });

  qualityRange.addEventListener("input", function () {
    qualityVal.textContent = qualityRange.value + "%";
    runCompression();
  });
  widthRange.addEventListener("input", function () {
    widthVal.textContent = widthRange.value + "px";
    runCompression();
  });

  resetBtn.addEventListener("click", function () {
    sourceImage = null;
    imgInput.value = "";
    compressorBody.classList.remove("active");
    originalPreview.src = "";
    compressedPreview.src = "";
    originalSize.textContent = "--";
    compressedSize.textContent = "--";
    compressSavings.innerHTML = '<i class="fa fa-circle-check"></i> Choose a photo to see the size reduction';
    dropzone.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
})();
