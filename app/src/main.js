// Wires the Vice Nights editor: photo slots with crop sliders, layout/theme/caption
// controls, a live preview canvas, and full-size PNG exports in three post sizes.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { renderCover, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const captionInput = document.getElementById('caption');
const subcaptionInput = document.getElementById('subcaption');
const layoutSelect = document.getElementById('layout');
const themeSelect = document.getElementById('theme');
const panelMapSelect = document.getElementById('panelmap');
const captionPosSelect = document.getElementById('captionpos');

const state = {
  photos: [null, null, null],
  slots: [
    { zoom: 1, panX: 0, panY: 0 },
    { zoom: 1, panX: 0, panY: 0 },
    { zoom: 1, panX: 0, panY: 0 },
  ],
  layout: 'hero',
  theme: 'sunset',
  panelMap: 'spread',
  caption: 'VICE NIGHTS',
  subcaption: 'ONE CITY · TWO LIVES · NO WAY BACK',
  captionPos: 'bottom',
};

function redraw() {
  renderCover(canvas, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function setPhoto(index, img) {
  state.photos[index] = img;
  document.querySelector(`.slot[data-slot="${index}"]`).classList.add('loaded');
  redraw();
}

document.querySelectorAll('input[data-photo]').forEach((input) => {
  input.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setPhoto(Number(input.dataset.photo), await loadImage(URL.createObjectURL(file)));
    status.textContent = `Photo ${Number(input.dataset.photo) + 1} loaded: ${file.name}`;
  });
});

document.querySelectorAll('input[data-zoom]').forEach((input) => {
  input.addEventListener('input', () => {
    state.slots[Number(input.dataset.zoom)].zoom = Number(input.value);
    redraw();
  });
});
document.querySelectorAll('input[data-panx]').forEach((input) => {
  input.addEventListener('input', () => {
    state.slots[Number(input.dataset.panx)].panX = Number(input.value);
    redraw();
  });
});
document.querySelectorAll('input[data-pany]').forEach((input) => {
  input.addEventListener('input', () => {
    state.slots[Number(input.dataset.pany)].panY = Number(input.value);
    redraw();
  });
});

async function loadSample(name, intoSlots) {
  const img = await loadImage(`samples/${name}.jpg`);
  for (const index of intoSlots) setPhoto(index, img);
}

document.getElementById('sample-boulevard').addEventListener('click', async () => {
  await loadSample('boulevard', [0]);
  status.textContent = 'Sample photo loaded into slot 1.';
});
document.getElementById('sample-pier').addEventListener('click', async () => {
  await loadSample('pier', [1]);
  status.textContent = 'Sample photo loaded into slot 2.';
});
document.getElementById('sample-both').addEventListener('click', async () => {
  const boulevard = await loadImage('samples/boulevard.jpg');
  const pier = await loadImage('samples/pier.jpg');
  setPhoto(0, boulevard);
  setPhoto(1, pier);
  setPhoto(2, boulevard);
  status.textContent = 'Sample photos filled all three panels.';
});

layoutSelect.addEventListener('change', () => { state.layout = layoutSelect.value; redraw(); });
themeSelect.addEventListener('change', () => { state.theme = themeSelect.value; redraw(); });
panelMapSelect.addEventListener('change', () => { state.panelMap = panelMapSelect.value; redraw(); });
captionPosSelect.addEventListener('change', () => { state.captionPos = captionPosSelect.value; redraw(); });
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subcaptionInput.addEventListener('input', () => { state.subcaption = subcaptionInput.value; redraw(); });

/** Renders the cover at full export size and returns a PNG blob. */
export function exportCover(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  renderCover(off, state);
  return new Promise((resolve) => off.toBlob(resolve, 'image/png'));
}

function wireExport(buttonId, sizeKey) {
  document.getElementById(buttonId).addEventListener('click', async () => {
    const blob = await exportCover(sizeKey);
    const size = SIZES[sizeKey];
    const name = `vice-nights-${size.w}x${size.h}.png`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    status.textContent = `Saved ${name} (${blob.size.toLocaleString()} bytes).`;
  });
}
wireExport('export-square', 'square');
wireExport('export-portrait', 'portrait');
wireExport('export-wide', 'wide');

const exportView = document.getElementById('exportview');
const exportViewImg = document.getElementById('exportview-img');
document.getElementById('preview-export').addEventListener('click', async () => {
  const blob = await exportCover('portrait');
  exportViewImg.src = URL.createObjectURL(blob);
  exportView.hidden = false;
  status.textContent = 'Showing the exported 1080 × 1350 cover.';
});
document.getElementById('exportview-close').addEventListener('click', () => {
  exportView.hidden = true;
});

// Screenshot scenes (?shot=editor / ?shot=cover&size=portrait&theme=neon ...).
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, { state, setPhoto, loadImage, exportCover, redraw });
} else {
  // Wait for the bundled Anton font before the first paint so lettering is right.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(redraw);
  }
  redraw();
}

// Exposed for the screenshot scenes and for debugging in the console.
window.__viceNights = { state, redraw, exportCover, loadImage, setPhoto };
