// Fixed scenes for screenshots.
//   ?shot=editor — the editor with sample photos loaded and a caption set.
//   ?shot=cover&size=portrait|square|wide — the exported cover alone, drawn by the
//     app's own renderer at the requested post size, filling the viewport.
// Query knobs: photo (sample name), caption, subcaption, theme, layout, panelmap.
// window.__shotReady is set once the scene has painted, so a screenshot knows when
// to fire. The cover scene draws from the same renderCover the export button uses.
import { SIZES } from './cover.js';

export async function runShot(shot, query, app) {
  const { state, setPhoto, loadImage, redraw } = app;
  const photoName = query.get('photo') ?? 'boulevard';
  const otherName = query.get('photo2') ?? 'pier';

  if (query.get('caption')) {
    state.caption = query.get('caption');
    document.getElementById('caption').value = state.caption;
  }
  if (query.get('subcaption')) {
    state.subcaption = query.get('subcaption');
    document.getElementById('subcaption').value = state.subcaption;
  }
  if (query.get('theme')) {
    state.theme = query.get('theme');
    document.getElementById('theme').value = state.theme;
  }
  if (query.get('layout')) {
    state.layout = query.get('layout');
    document.getElementById('layout').value = state.layout;
  }
  if (query.get('panelmap')) {
    state.panelMap = query.get('panelmap');
    document.getElementById('panelmap').value = state.panelmap;
  }

  // Load the bundled sample photos (image-model-made, free to use) into the slots.
  const first = await loadImage(`samples/${photoName}.jpg`);
  const second = await loadImage(`samples/${otherName}.jpg`);
  setPhoto(0, first);
  setPhoto(1, second);
  setPhoto(2, first);
  // Optional framing for a shot: ?zoom0=1.2&panx0=0.1&pany0=-0.3 (per slot).
  for (let i = 0; i < 3; i++) {
    const zoom = Number(query.get(`zoom${i}`));
    if (Number.isFinite(zoom) && zoom >= 1 && zoom <= 3) state.slots[i].zoom = zoom;
    const panx = Number(query.get(`panx${i}`));
    if (Number.isFinite(panx)) state.slots[i].panX = Math.max(-1, Math.min(1, panx));
    const pany = Number(query.get(`pany${i}`));
    if (Number.isFinite(pany)) state.slots[i].panY = Math.max(-1, Math.min(1, pany));
  }

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const sizeKey = query.get('size') || 'portrait';
    const size = SIZES[sizeKey] || SIZES.portrait;
    const canvas = document.getElementById('cover');
    canvas.width = size.w;
    canvas.height = size.h;
  }

  // Wait for the Anton font, then paint twice so the canvas is settled.
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  redraw();
  window.__shotReady = true;
}
