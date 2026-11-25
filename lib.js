// Colour parsing, WCAG 2.x contrast, and OKLCH-based fixes. Pure functions.

const clamp = (x, a = 0, b = 255) => Math.min(b, Math.max(a, x));

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
}

export function parse(input) {
  const s = String(input).trim().toLowerCase();
  let m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  m = s.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  if (m) return m.slice(1, 4).map((v) => clamp(+v));
  m = s.match(/^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/);
  if (m) return hslToRgb(+m[1] % 360, clamp(+m[2], 0, 100), clamp(+m[3], 0, 100));
  return null;
}

export const toHex = (rgb) => '#' + rgb.map((v) => Math.round(clamp(v)).toString(16).padStart(2, '0')).join('');

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const unlin = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function luminance([r, g, b]) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

export const grade = (ratio) => ({
  aaNormal: ratio >= 4.5,
  aaaNormal: ratio >= 7,
  aaLarge: ratio >= 3,
  aaaLarge: ratio >= 4.5,
  ui: ratio >= 3,
});

export function toOklch(rgb) {
  const [r, g, b] = rgb.map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180) / Math.PI];
}

export function fromOklch(L, C, H) {
  const A = C * Math.cos((H * Math.PI) / 180), B = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => Math.round(clamp(unlin(Math.min(1, Math.max(0, v))))));
}

/**
 * Nearest colour to fg (same hue, chroma reduced only if needed) that reaches `target`
 * contrast against bg. Moves lightness away from the background.
 */
export function suggest(fg, bg, target) {
  if (contrast(fg, bg) >= target) return fg;
  const [L, C, H] = toOklch(fg);
  const bgL = toOklch(bg)[0];
  const tryDir = (dir) => {
    let lo = L, hi = dir < 0 ? 0 : 1;
    const ok = (x) => contrast(fromOklch(x, C, H), bg) >= target;
    if (!ok(hi)) return null;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (ok(mid)) hi = mid; else lo = mid;
    }
    return fromOklch(hi, C, H);
  };
  const first = bgL > 0.6 ? -1 : bgL < 0.4 ? 1 : (L < bgL ? -1 : 1);
  return tryDir(first) || tryDir(-first) || (luminance(bg) > 0.18 ? [0, 0, 0] : [255, 255, 255]);
}
