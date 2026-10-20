const $ = (id) => document.getElementById(id);

const video = $("camera");
const captureCanvas = $("captureCanvas");
const captureCtx = captureCanvas.getContext("2d");
const cameraPlaceholder = $("cameraPlaceholder");
const countdownOverlay = $("countdownOverlay");
const countdownNumber = $("countdownNumber");
const startBtn = $("startBtn");
const enableCameraBtn = $("enableCameraBtn");
const retakeAllBtn = $("retakeAllBtn");
const retakeBtn = $("retakeBtn");
const downloadBtn = $("downloadBtn");
const cameraMessage = $("cameraMessage");
const photoSlots = $("photoSlots");
const photoCount = $("photoCount");
const finalPreviewWrap = $("finalPreviewWrap");
const finalPreview = $("finalPreview");
const toast = $("toast");

let cameraStream = null;
let photos = [null, null, null, null];
let frameColor = "#fff8f2";
let isCapturing = false;
let toastTimer = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function setMessage(message) {
  cameraMessage.textContent = message;
}

async function enableCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast("Camera access needs a modern browser and a secure local page.");
    setMessage("Open this app using localhost (see README) and try again.");
    return false;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false
    });
    video.srcObject = cameraStream;
    await video.play();
    cameraPlaceholder.classList.add("hidden");
    enableCameraBtn.textContent = "Camera ready";
    setMessage("Camera ready. Choose your vibe, then start your session.");
    showToast("Camera is ready ♡");
    return true;
  } catch (error) {
    console.error(error);
    let message = "Camera access was not available. Check your browser permissions.";
    if (error.name === "NotAllowedError") message = "Camera permission was denied. Allow camera access in your browser settings.";
    if (error.name === "NotFoundError") message = "No camera was found. Connect a camera and try again.";
    setMessage(message);
    showToast(message);
    return false;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getFilter() {
  return $("filterSelect").value;
}

function filterCanvas(ctx, filter) {
  if (filter === "mono") return "grayscale(1) contrast(1.05)";
  if (filter === "soft") return "saturate(.78) brightness(1.07) sepia(.08)";
  if (filter === "warm") return "sepia(.22) saturate(1.15) contrast(1.02)";
  return "none";
}

function capturePhoto() {
  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 960;
  captureCanvas.width = width;
  captureCanvas.height = height;
  captureCtx.save();
  captureCtx.translate(width, 0);
  captureCtx.scale(-1, 1);
  captureCtx.filter = filterCanvas(captureCtx, getFilter());
  captureCtx.drawImage(video, 0, 0, width, height);
  captureCtx.restore();
  return captureCanvas.toDataURL("image/jpeg", 0.92);
}

async function countdown(seconds) {
  countdownOverlay.classList.remove("hidden");
  for (let n = seconds; n > 0; n--) {
    countdownNumber.textContent = n;
    await sleep(1000);
  }
  countdownNumber.textContent = "♡";
  await sleep(250);
  countdownOverlay.classList.add("hidden");
}

async function startSession() {
  if (isCapturing) return;
  if (!cameraStream) {
    const ok = await enableCamera();
    if (!ok) return;
  }
  if (video.readyState < 2) {
    showToast("The camera is still warming up. Try again in a moment.");
    return;
  }

  isCapturing = true;
  photos = [null, null, null, null];
  renderSlots();
  updateButtons();
  startBtn.disabled = true;
  retakeAllBtn.disabled = true;
  const seconds = Number($("timerSelect").value);

  try {
    for (let i = 0; i < 4; i++) {
      setMessage(`Photo ${i + 1} of 4 — get ready for your pose!`);
      await countdown(seconds);
      photos[i] = capturePhoto();
      renderSlots();
      await sleep(450);
    }
    setMessage("All four shots are ready! Your photo strip is waiting below.");
    showToast("Four cute moments captured ✦");
    renderFinalPreview();
  } catch (error) {
    console.error(error);
    showToast("Something went wrong during capture. Please try again.");
    setMessage("Capture stopped. Please start a new session.");
  } finally {
    isCapturing = false;
    startBtn.disabled = false;
    retakeAllBtn.disabled = false;
    updateButtons();
    startBtn.innerHTML = "Take another session <span>↗</span>";
  }
}

function renderSlots() {
  photoSlots.innerHTML = "";
  photos.forEach((photo, index) => {
    if (!photo) {
      const empty = document.createElement("div");
      empty.className = "empty-slot";
      empty.innerHTML = `<span>0${index + 1}</span><b>♡</b><small>${["your first shot","your second shot","your third shot","your fourth shot"][index]}</small>`;
      photoSlots.appendChild(empty);
      return;
    }
    const card = document.createElement("div");
    card.className = "slot-card";
    const img = document.createElement("img");
    img.src = photo;
    img.alt = `Photo ${index + 1}`;
    img.style.filter = filterCanvas(null, getFilter());
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "↻";
    remove.title = `Retake photo ${index + 1}`;
    remove.setAttribute("aria-label", `Retake photo ${index + 1}`);
    remove.addEventListener("click", () => retakeOne(index));
    const label = document.createElement("small");
    label.className = "slot-number";
    label.textContent = `SHOT 0${index + 1}`;
    card.append(img, remove, label);
    photoSlots.appendChild(card);
  });
  const count = photos.filter(Boolean).length;
  photoCount.textContent = `${count} / 4 photos`;
  updateButtons();
}

function updateButtons() {
  const complete = photos.every(Boolean);
  downloadBtn.disabled = !complete || isCapturing;
  retakeBtn.disabled = !photos.some(Boolean) || isCapturing;
  retakeAllBtn.disabled = isCapturing || !photos.some(Boolean);
}

async function retakeOne(index) {
  if (isCapturing) return;
  if (!cameraStream) {
    const ok = await enableCamera();
    if (!ok) return;
  }
  isCapturing = true;
  startBtn.disabled = true;
  retakeAllBtn.disabled = true;
  downloadBtn.disabled = true;
  try {
    setMessage(`Retaking photo ${index + 1} of 4.`);
    await countdown(Number($("timerSelect").value));
    photos[index] = capturePhoto();
    renderSlots();
    renderFinalPreview();
    setMessage(`Photo ${index + 1} updated.`);
    showToast(`Photo ${index + 1} retaken ♡`);
  } finally {
    isCapturing = false;
    startBtn.disabled = false;
    retakeAllBtn.disabled = false;
    updateButtons();
  }
}

function getLoadedImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function composePhotoStrip() {
  if (!photos.every(Boolean)) throw new Error("Take all four photos first.");
  const layout = $("layoutSelect").value;
  const caption = $("captionInput").value.trim().slice(0, 28);
  const images = await Promise.all(photos.map(getLoadedImage));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (layout === "strip") {
    const w = 600, photoW = 520, photoH = 390, gap = 22, top = 40, side = 40, captionH = 100;
    canvas.width = w;
    canvas.height = top + (photoH * 4) + (gap * 3) + captionH + 45;
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    images.forEach((img, i) => {
      const x = side, y = top + i * (photoH + gap);
      drawCover(ctx, img, x, y, photoW, photoH);
    });
    ctx.fillStyle = frameColor === "#272624" ? "#fff8f2" : "#594a48";
    ctx.textAlign = "center";
    ctx.font = "500 24px Georgia, serif";
    ctx.fillText(caption || "a day to remember ♡", w / 2, canvas.height - 60, w - 40);
    ctx.font = "12px sans-serif";
    ctx.globalAlpha = .7;
    ctx.fillText("SNAP  ·  PHOTO BOOTH", w / 2, canvas.height - 28);
    ctx.globalAlpha = 1;
  } else {
    const w = 1000, pad = 42, gap = 24, cellW = 446, cellH = 335, captionH = 100;
    canvas.width = w;
    canvas.height = pad + cellH * 2 + gap + captionH + pad;
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const positions = [
      [pad, pad], [pad + cellW + gap, pad],
      [pad, pad + cellH + gap], [pad + cellW + gap, pad + cellH + gap]
    ];
    images.forEach((img, i) => drawCover(ctx, img, positions[i][0], positions[i][1], cellW, cellH));
    ctx.fillStyle = frameColor === "#272624" ? "#fff8f2" : "#594a48";
    ctx.textAlign = "center";
    ctx.font = "500 27px Georgia, serif";
    ctx.fillText(caption || "a day to remember ♡", w / 2, canvas.height - 57, w - 50);
    ctx.font = "12px sans-serif";
    ctx.globalAlpha = .7;
    ctx.fillText("SNAP  ·  PHOTO BOOTH", w / 2, canvas.height - 27);
    ctx.globalAlpha = 1;
  }
  return canvas;
}

function drawCover(ctx, img, x, y, w, h) {
  const sourceW = img.naturalWidth, sourceH = img.naturalHeight;
  const sourceRatio = sourceW / sourceH, targetRatio = w / h;
  let sx = 0, sy = 0, sw = sourceW, sh = sourceH;
  if (sourceRatio > targetRatio) {
    sw = sourceH * targetRatio;
    sx = (sourceW - sw) / 2;
  } else {
    sh = sourceW / targetRatio;
    sy = (sourceH - sh) / 2;
  }
  ctx.save();
  ctx.filter = filterCanvas(ctx, getFilter());
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

async function renderFinalPreview() {
  if (!photos.every(Boolean)) {
    finalPreviewWrap.classList.add("hidden");
    return;
  }
  try {
    const canvas = await composePhotoStrip();
    finalPreview.innerHTML = "";
    finalPreview.appendChild(canvas);
    finalPreviewWrap.classList.remove("hidden");
  } catch (error) {
    console.error(error);
  }
}

async function downloadStrip() {
  try {
    const canvas = await composePhotoStrip();
    const link = document.createElement("a");
    link.download = `snap-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("Your photo strip has been saved ✦");
  } catch (error) {
    showToast(error.message || "Couldn't create the image. Try again.");
  }
}

function resetSession() {
  if (isCapturing) return;
  photos = [null, null, null, null];
  renderSlots();
  finalPreview.innerHTML = "";
  finalPreviewWrap.classList.add("hidden");
  startBtn.innerHTML = "Start photo session <span>↗</span>";
  setMessage(cameraStream ? "Ready for a fresh set of memories." : "Allow camera access, then start your 4-cut session.");
  updateButtons();
}

function updateFrame(color) {
  frameColor = color;
  document.documentElement.style.setProperty("--frame", color);
  document.querySelectorAll(".swatch").forEach(button => {
    button.classList.toggle("active", button.dataset.frame === color);
  });
  renderFinalPreview();
}

enableCameraBtn.addEventListener("click", enableCamera);
startBtn.addEventListener("click", startSession);
retakeAllBtn.addEventListener("click", resetSession);
retakeBtn.addEventListener("click", () => {
  const index = photos.findIndex(Boolean);
  if (index >= 0) retakeOne(index);
});
downloadBtn.addEventListener("click", downloadStrip);
$("hidePreviewBtn").addEventListener("click", () => finalPreviewWrap.classList.add("hidden"));
$("layoutSelect").addEventListener("change", renderFinalPreview);
$("filterSelect").addEventListener("change", () => {
  renderSlots();
  renderFinalPreview();
});
$("captionInput").addEventListener("input", renderFinalPreview);
document.querySelectorAll(".swatch").forEach(button => {
  button.addEventListener("click", () => updateFrame(button.dataset.frame));
});

window.addEventListener("beforeunload", () => {
  if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
});

renderSlots();
