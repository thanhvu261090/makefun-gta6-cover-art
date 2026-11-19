// Vice Nights cover renderer: draws a multi-panel GTA 6-style poster onto a canvas.
// Every panel shows a photo with a sunset/neon colour grade, thick white gutters, a
// skyline silhouette along the hero panel, halftone dots, and bold Anton caption lettering.
// Nothing here loads from the network; photos are images the caller already holds.

export const THEMES = {
  sunset: {
    sky: ['#ffb03d', '#ff5e7a', '#7b2ff7'],
    grade: ['rgba(255, 150, 60, 0.30)', 'rgba(255, 60, 120, 0.22)', 'rgba(90, 30, 180, 0.30)'],
    strip: '#ffb03d',
    stripInk: '#2a0a3d',
    sun: '#ffd76a',
    skyline: '#1c0b33',
  },
  neon: {
    sky: ['#ff2ea6', '#7b2ff7', '#00e5ff'],
    grade: ['rgba(255, 46, 166, 0.30)', 'rgba(123, 47, 247, 0.22)', 'rgba(0, 229, 255, 0.26)'],
    strip: '#2ee6ff',
    stripInk: '#0a1030',
    sun: '#ff7ad9',
    skyline: '#12042b',
  },
  midnight: {
    sky: ['#5a3df0', '#2b1a6e', '#0d0a26'],
    grade: ['rgba(90, 61, 240, 0.28)', 'rgba(43, 26, 110, 0.24)', 'rgba(13, 10, 38, 0.34)'],
    strip: '#8f7bff',
    stripInk: '#12082e',
    sun: '#c9b8ff',
    skyline: '#0b061f',
  },
};

export const SIZES = {
  square: { w: 1080, h: 1080 },
  portrait: { w: 1080, h: 1350 },
  wide: { w: 1920, h: 1080 },
};

// Panel rectangles in 0..1 coordinates, per aspect and layout name.
// Each panel also names the photo slot it prefers (0, 1 or 2).
function panelsFor(aspect, layout) {
  const g = 0.014; // gutter, as a fraction of the short side
  if (aspect === 'portrait') {
    if (layout === 'duo') return [
      { x: 0, y: 0, w: 0.62, h: 1, slot: 0 },
      { x: 0.62 + g, y: 0, w: 1 - 0.62 - g, h: 0.5 - g / 2, slot: 1 },
      { x: 0.62 + g, y: 0.5 + g / 2, w: 1 - 0.62 - g, h: 0.5 - g / 2, slot: 2 },
    ];
    if (layout === 'trio') return [
      { x: 0, y: 0, w: 1, h: 0.34, slot: 0 },
      { x: 0, y: 0.34 + g, w: 1, h: 0.32, slot: 1 },
      { x: 0, y: 0.68 + g, w: 1, h: 1 - 0.68 - g, slot: 2 },
    ];
    return [ // hero
      { x: 0, y: 0, w: 1, h: 0.60, slot: 0 },
      { x: 0, y: 0.60 + g, w: 0.5 - g / 2, h: 1 - 0.60 - g, slot: 1 },
      { x: 0.5 + g / 2, y: 0.60 + g, w: 0.5 - g / 2, h: 1 - 0.60 - g, slot: 2 },
    ];
  }
  if (aspect === 'wide') {
    if (layout === 'trio') return [
      { x: 0, y: 0, w: 0.34, h: 1, slot: 0 },
      { x: 0.34 + g, y: 0, w: 0.32, h: 1, slot: 1 },
      { x: 0.68 + g, y: 0, w: 1 - 0.68 - g, h: 1, slot: 2 },
    ];
    if (layout === 'hero') return [
      { x: 0, y: 0, w: 1, h: 0.58, slot: 0 },
      { x: 0, y: 0.58 + g, w: 0.5 - g / 2, h: 1 - 0.58 - g, slot: 1 },
      { x: 0.5 + g / 2, y: 0.58 + g, w: 0.5 - g / 2, h: 1 - 0.58 - g, slot: 2 },
    ];
    return [ // duo
      { x: 0, y: 0, w: 0.56, h: 1, slot: 0 },
      { x: 0.56 + g, y: 0, w: 1 - 0.56 - g, h: 0.5 - g / 2, slot: 1 },
      { x: 0.56 + g, y: 0.5 + g / 2, w: 1 - 0.56 - g, h: 0.5 - g / 2, slot: 2 },
    ];
  }
  // square
  if (layout === 'duo') return [
    { x: 0, y: 0, w: 0.60, h: 1, slot: 0 },
    { x: 0.60 + g, y: 0, w: 1 - 0.60 - g, h: 0.5 - g / 2, slot: 1 },
    { x: 0.60 + g, y: 0.5 + g / 2, w: 1 - 0.60 - g, h: 0.5 - g / 2, slot: 2 },
  ];
  if (layout === 'trio') return [
    { x: 0, y: 0, w: 1, h: 0.34, slot: 0 },
    { x: 0, y: 0.34 + g, w: 1, h: 0.32, slot: 1 },
    { x: 0, y: 0.68 + g, w: 1, h: 1 - 0.68 - g, slot: 2 },
  ];
  return [ // hero
    { x: 0, y: 0, w: 1, h: 0.56, slot: 0 },
    { x: 0, y: 0.56 + g, w: 0.5 - g / 2, h: 1 - 0.56 - g, slot: 1 },
    { x: 0.5 + g / 2, y: 0.56 + g, w: 0.5 - g / 2, h: 1 - 0.56 - g, slot: 2 },
  ];
}

/** Draws one photo into a panel rect with cover-fit, zoom and pan. */
function drawPhotoPanel(ctx, img, slot, px, py, pw, ph) {
  if (!img) {
    // Empty slot: a sunset gradient with a soft sun, so the poster still reads.
    const grad = ctx.createLinearGradient(px, py, px, py + ph);
    grad.addColorStop(0, '#ff9a3d');
    grad.addColorStop(0.55, '#ff5e7a');
    grad.addColorStop(1, '#5a1f8f');
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, pw, ph);
    const sun = ctx.createRadialGradient(px + pw * 0.72, py + ph * 0.34, 4, px + pw * 0.72, py + ph * 0.34, pw * 0.22);
    sun.addColorStop(0, 'rgba(255, 230, 150, 0.95)');
    sun.addColorStop(1, 'rgba(255, 230, 150, 0)');
    ctx.fillStyle = sun;
    ctx.fillRect(px, py, pw, ph);
    return;
  }
  const zoom = slot.zoom || 1;
  const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const slackX = Math.max(0, (dw - pw) / 2);
  const slackY = Math.max(0, (dh - ph) / 2);
  const dx = px + (pw - dw) / 2 - (slot.panX || 0) * slackX;
  const dy = py + (ph - dh) / 2 - (slot.panY || 0) * slackY;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** A simple skyline silhouette with a few lit windows, along a panel's bottom edge. */
function drawSkyline(ctx, theme, px, py, pw, ph) {
  const base = py + ph;
  const bandTop = py + ph * 0.88;
  // Deterministic pseudo-random heights from the building index, so every render matches.
  const heightAt = (i) => {
    const r = ((i * 2654435761) % 1000) / 1000;
    return ph * (0.02 + r * 0.055) + (i % 7 === 3 ? ph * 0.05 : 0); // an occasional tower
  };
  ctx.fillStyle = theme.skyline;
  ctx.beginPath();
  ctx.moveTo(px, base);
  let x = px;
  let i = 0;
  const tops = [];
  while (x < px + pw) {
    const bw = pw * (0.045 + (((i * 37) % 10) / 10) * 0.05);
    const top = bandTop - heightAt(i) + ph * 0.06;
    tops.push({ x, w: bw, top });
    ctx.lineTo(x, top);
    if (i % 7 === 3) { // antenna on the tower
      ctx.lineTo(x + bw / 2 - 1, top);
      ctx.lineTo(x + bw / 2 - 1, top - ph * 0.02);
      ctx.lineTo(x + bw / 2 + 1, top - ph * 0.02);
      ctx.lineTo(x + bw / 2 + 1, top);
    }
    ctx.lineTo(x + bw, top);
    x += bw;
    i++;
  }
  ctx.lineTo(px + pw, base);
  ctx.closePath();
  ctx.fill();
  // Lit windows: tiny warm dots inside the buildings only.
  ctx.fillStyle = 'rgba(255, 200, 90, 0.9)';
  const dot = Math.max(2, pw * 0.004);
  for (const b of tops) {
    const rows = Math.floor((base - b.top) / (dot * 3));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < Math.floor(b.w / (dot * 3)); c++) {
        if (((r * 5 + c * 3 + Math.floor(b.x)) % 4) === 0) {
          ctx.fillRect(b.x + dot + c * dot * 3, b.top + dot + r * dot * 3, dot, dot);
        }
      }
    }
  }
}

/** Halftone dots fading into one corner of a panel. */
function drawHalftone(ctx, px, py, pw, ph) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.20)';
  const step = Math.max(9, pw * 0.022);
  for (let y = py + ph - step; y > py + ph * 0.62; y -= step) {
    const fade = (y - (py + ph * 0.62)) / (ph * 0.38);
    for (let x = px + pw - step; x > px + pw * 0.55; x -= step) {
      const r = step * 0.32 * fade;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.6, r), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Wraps text into at most two lines that fit maxWidth at the given font. */
function wrapCaption(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || !line) {
      line = trial;
    } else {
      lines.push(line);
      line = word;
    }
    if (lines.length === 2) break;
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

/** The big caption: Anton, white fill, heavy black outline, slight tilt, hard shadow. */
function drawCaption(ctx, theme, text, cx, cy, maxWidth, size) {
  const words = (text || 'VICE NIGHTS').toUpperCase();
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.028);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fontSize = size;
  ctx.font = `${fontSize}px Anton, sans-serif`;
  while (fontSize > size * 0.45 && ctx.measureText(words).width > maxWidth) {
    fontSize *= 0.92;
    ctx.font = `${fontSize}px Anton, sans-serif`;
  }
  const lines = wrapCaption(ctx, words, maxWidth);
  const lineHeight = fontSize * 0.98;
  const total = lineHeight * lines.length;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = fontSize * 0.06;
  ctx.shadowOffsetY = fontSize * 0.07;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  lines.forEach((lineText, i) => {
    const y = -total / 2 + lineHeight * (i + 0.5);
    ctx.lineWidth = fontSize * 0.16;
    ctx.strokeStyle = '#14061f';
    ctx.strokeText(lineText, 0, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(lineText, 0, y);
  });
  ctx.restore();
  return lines;
}

/**
 * Renders the whole cover onto `canvas` (which must already be the export size).
 * state: { photos:[img|null x3], slots:[{zoom,panX,panY} x3], layout, theme,
 *          panelMap:'spread'|'single', caption, subcaption, captionPos:'top'|'bottom' }
 */
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const aspect = W === H ? 'square' : W > H ? 'wide' : 'portrait';
  const theme = THEMES[state.theme] || THEMES.sunset;
  const panels = panelsFor(aspect, state.layout || 'hero');

  // Outer paper: white poster border, then the panels sit inside it.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  const border = Math.round(Math.min(W, H) * 0.012);
  const innerX = border;
  const innerY = border;
  const innerW = W - border * 2;
  const innerH = H - border * 2;

  panels.forEach((panel, i) => {
    const px = innerX + panel.x * innerW;
    const py = innerY + panel.y * innerH;
    const pw = panel.w * innerW;
    const ph = panel.h * innerH;
    const slotIndex = state.panelMap === 'single' ? 0 : panel.slot;
    const img = state.photos[slotIndex] || null;
    const slot = state.slots[slotIndex] || { zoom: 1, panX: 0, panY: 0 };

    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    drawPhotoPanel(ctx, img, slot, px, py, pw, ph);
    // Sunset / neon grade over the photo.
    const grade = ctx.createLinearGradient(px, py, px, py + ph);
    grade.addColorStop(0, theme.grade[0]);
    grade.addColorStop(0.55, theme.grade[1]);
    grade.addColorStop(1, theme.grade[2]);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grade;
    ctx.fillRect(px, py, pw, ph);
    ctx.globalCompositeOperation = 'source-over';
    // Gentle vignette so panel edges read.
    const vig = ctx.createRadialGradient(
      px + pw / 2, py + ph / 2, Math.min(pw, ph) * 0.35,
      px + pw / 2, py + ph / 2, Math.max(pw, ph) * 0.75,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(10, 2, 24, 0.38)');
    ctx.fillStyle = vig;
    ctx.fillRect(px, py, pw, ph);
    if (i === 0) {
      // Sun disc in the hero panel's top-right corner: a crisp disc, soft glow only.
      const sunX = px + pw * 0.88;
      const sunY = py + ph * 0.16;
      const sunR = Math.min(pw, ph) * 0.085;
      const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.8, sunX, sunY, sunR * 1.9);
      glow.addColorStop(0, theme.sun);
      glow.addColorStop(0.55, theme.sun);
      glow.addColorStop(1, 'rgba(255, 180, 80, 0)');
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = theme.sun;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();
      drawSkyline(ctx, theme, px, py, pw, ph);
    }
    drawHalftone(ctx, px, py, pw, ph);
    ctx.restore();
  });

  // Caption over the hero panel.
  const hero = panels[0];
  const hx = innerX + hero.x * innerW;
  const hy = innerY + hero.y * innerH;
  const hw = hero.w * innerW;
  const hh = hero.h * innerH;
  const captionY = state.captionPos === 'top'
    ? hy + hh * 0.16
    : hy + hh * 0.80;
  drawCaption(ctx, theme, state.caption, hx + hw / 2, captionY, hw * 0.92, Math.min(W, H) * 0.115);

  // Sub-caption strip across the foot of the poster.
  const sub = (state.subcaption || '').trim();
  if (sub) {
    const stripH = Math.round(H * 0.052);
    const stripY = H - border - stripH;
    ctx.fillStyle = theme.strip;
    ctx.fillRect(innerX, stripY, innerW, stripH);
    ctx.fillStyle = theme.stripInk;
    ctx.font = `700 ${Math.round(stripH * 0.42)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    try { ctx.letterSpacing = `${Math.round(stripH * 0.10)}px`; } catch (_) { /* older canvas */ }
    ctx.fillText(sub.toUpperCase(), W / 2, stripY + stripH / 2 + 1);
    try { ctx.letterSpacing = '0px'; } catch (_) { /* older canvas */ }
  }
  return { aspect, panels: panels.length };
}
