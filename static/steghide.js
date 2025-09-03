// Minimal DOM helpers
function $(id) { return document.getElementById(id); }

// Tabs
const encodeSection = $("encode-section");
const decodeSection = $("decode-section");
$("tab-encode").addEventListener("click", () => {
  encodeSection.style.display = "block";
  decodeSection.style.display = "none";
});
$("tab-decode").addEventListener("click", () => {
  encodeSection.style.display = "none";
  decodeSection.style.display = "block";
});

// Modal controls
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}
document.addEventListener("click", (e) => {
  const target = e.target;
  if (target && target.getAttribute && target.getAttribute("data-close")) {
    closeModal(target.getAttribute("data-close"));
  }
});

// Load image into canvas and return {canvas, ctx, imageData}
async function loadImageToCanvas(file) {
  const imgUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = imgUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return { canvas, ctx, imageData };
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
}

// Text to binary string (8-bit per char)
function textToBinary(text) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const bin = text.charCodeAt(i).toString(2).padStart(8, "0");
    out += bin;
  }
  return out;
}

// Binary string to text (8-bit per char)
function binaryToText(binStr) {
  let out = "";
  for (let i = 0; i + 7 < binStr.length; i += 8) {
    const byte = binStr.slice(i, i + 8);
    out += String.fromCharCode(parseInt(byte, 2));
  }
  return out;
}

// Compute capacity in bytes for RGBA image using only RGB LSBs
function capacityBytes(width, height) {
  const totalColorComponents = width * height * 3; // R,G,B
  return Math.floor(totalColorComponents / 8);
}

// Encode handler
$("encode-image").addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  $("encode-result").style.display = "none";
  $("encode-capacity").textContent = "";
  if (!file) return;
  const { canvas } = await loadImageToCanvas(file);
  const cap = capacityBytes(canvas.width, canvas.height);
  $("encode-capacity").textContent = `Estimated capacity: ${cap} bytes`;
});

$("encode-button").addEventListener("click", async () => {
  const fileInput = $("encode-image");
  const message = $("encode-message").value || "";
  const secret = $("encode-secret").value || "";
  if (!fileInput.files || !fileInput.files[0]) { alert("Select a cover image"); return; }
  if (!message) { alert("Enter a message to encode"); return; }
  if (!secret) { alert("Enter a secret code"); return; }
  if (secret.length > 5) { alert("Secret code must be at most 5 characters"); return; }

  const { canvas, ctx, imageData } = await loadImageToCanvas(fileInput.files[0]);
  const cap = capacityBytes(canvas.width, canvas.height);

  const payload = message + secret;
  const payloadBin = textToBinary(payload);
  const neededBytes = Math.ceil(payloadBin.length / 8);
  if (neededBytes > cap) { alert("Message too long for this image. Choose a larger image or shorter text."); return; }

  const data = imageData.data; // RGBA
  let bitIndex = 0;
  for (let i = 0; i < data.length && bitIndex < payloadBin.length; i += 4) {
    for (let c = 0; c < 3 && bitIndex < payloadBin.length; c++) {
      const bitVal = payloadBin[bitIndex] === '1' ? 1 : 0;
      data[i + c] = (data[i + c] & 0xFE) | bitVal; // set LSB
      bitIndex++;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const outUrl = canvas.toDataURL("image/png");
  const preview = $("encode-canvas");
  preview.width = canvas.width;
  preview.height = canvas.height;
  const pctx = preview.getContext("2d");
  const img = new Image();
  img.onload = () => {
    pctx.drawImage(img, 0, 0);
    $("download-link").href = outUrl;
    openModal("encode-modal");
  };
  img.src = outUrl;
});

// Decode handler
$("decode-button").addEventListener("click", async () => {
  const fileInput = $("decode-image");
  const secret = $("decode-secret").value || "";
  if (!fileInput.files || !fileInput.files[0]) { alert("Select an encoded image"); return; }
  if (!secret) { alert("Enter the secret code"); return; }

  const { imageData } = await loadImageToCanvas(fileInput.files[0]);
  const data = imageData.data;

  let bits = "";
  for (let i = 0; i < data.length; i += 4) {
    bits += (data[i] & 1).toString();     // R
    bits += (data[i + 1] & 1).toString(); // G
    bits += (data[i + 2] & 1).toString(); // B
  }

  // Convert in blocks of 8 and stop when secret appears
  let text = "";
  for (let i = 0; i + 7 < bits.length; i += 8) {
    const byte = bits.slice(i, i + 8);
    text += String.fromCharCode(parseInt(byte, 2));
    if (text.endsWith(secret)) {
      text = text.slice(0, -secret.length);
      break;
    }
  }

  $("decoded-text").value = text || "";
  openModal("decode-modal");
});

// Copy decoded text
$("copy-decoded").addEventListener("click", async () => {
  const text = $("decoded-text").value || "";
  try {
    await navigator.clipboard.writeText(text);
    alert("Copied to clipboard");
  } catch (_) {
    // Fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    alert("Copied to clipboard");
  }
});


