/**
 * OC skin runtime fixes (bundled, because the page CSP blocks inline scripts).
 *
 * Rules that must beat runtime-injected CSS modules are applied as inline
 * `!important` styles on the actual elements. Everything is throttled: the chat
 * list mutates constantly and an unthrottled observer made the UI sluggish.
 */

const ICON_COLOR_DARK = '#2C353C';
const BAR_COLOR = '#3F4A54';
const ICON_COLOR_LIGHT = '#FFFFFF';
const AVATAR_RADIUS = '12px';

function setImportant(el: HTMLElement, prop: string, value: string) {
  el.style.setProperty(prop, value, 'important');
}

function paintDescendants(el: Element, color: string) {
  el.querySelectorAll<SVGElement | HTMLElement>('svg, path, use, g, i, span').forEach((node) => {
    (node as HTMLElement).style.setProperty('color', color, 'important');
    (node as HTMLElement).style.setProperty('fill', color, 'important');
  });
}

/** Top strip: keep the bar dark and every icon white, whatever the module CSS says. */
function fixTopBars() {
  document.querySelectorAll<HTMLElement>('.LeftMainHeader, .left-header, .MiddleHeader, .MiddleHeader *').forEach((el) => {
    if (!el.classList.contains('LeftMainHeader') && !el.classList.contains('left-header')
        && !el.classList.contains('MiddleHeader')) return;
    setImportant(el, 'background-color', BAR_COLOR);
  });

  document.querySelectorAll<HTMLElement>('button, [class*="Button"]').forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top > 150 || rect.height === 0 || rect.width === 0) return;
    setImportant(el, 'color', ICON_COLOR_LIGHT);
    paintDescendants(el, ICON_COLOR_LIGHT);
  });
}

/** Avatars: square-ish with the same radius on every layer, never clipped to a半圓. */
function fixAvatars() {
  document.querySelectorAll<HTMLElement>('[class*="avatar"], [class*="Avatar"]').forEach((el) => {
    setImportant(el, 'border-radius', AVATAR_RADIUS);
    setImportant(el, 'clip-path', 'none');
    setImportant(el, 'overflow', 'hidden');
    setImportant(el, 'transform', 'none');
  });
}

function fixTails() {
  document.querySelectorAll<HTMLElement>('.svg-appendix, [class*="appendix"], [class*="avatar-badge"]').forEach((el) => {
    setImportant(el, 'display', 'none');
  });
}

function fixScroll() {
  document.querySelectorAll<HTMLElement>('.custom-scroll, [class*="scrollable"]').forEach((el) => {
    const overflowY = getComputedStyle(el).overflowY;
    if (overflowY === 'hidden' || overflowY === 'clip') setImportant(el, 'overflow-y', 'auto');
  });
}

function applyFixes() {
  fixTopBars();
  fixAvatars();
  fixTails();
  fixScroll();
}

let pending = false;
function applySoon() {
  if (pending) return;
  pending = true;
  window.setTimeout(() => {
    pending = false;
    applyFixes();
  }, 250);
}

/** Diagnostic snapshot the app reads via `window.__ocReport()`. */
function collectReport() {
  const rows: string[] = [];
  document.querySelectorAll<HTMLElement>('div, header, nav, section, button').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.height < 18 || r.height > 160 || r.width < 120) return;
    if (r.top > 170) return;
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor;
    if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return;
    rows.push(`y${Math.round(r.top)} h${Math.round(r.height)} ${el.tagName}.${String(el.className).slice(0, 50)} bg=${bg}`);
  });
  const avatars = Array.from(document.querySelectorAll<HTMLElement>('[class*="avatar"], [class*="Avatar"]'))
    .slice(0, 6)
    .map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return `av ${String(el.className).slice(0, 40)} ${Math.round(r.width)}x${Math.round(r.height)} r=${cs.borderRadius} ov=${cs.overflow}`;
    });
  return [...rows.slice(0, 12), '--', ...avatars].join(' | ');
}

declare global {
  interface Window { __ocReport?: () => string }
}

if (typeof window !== 'undefined') {
  window.__ocReport = collectReport;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyFixes);
  else applyFixes();
  window.addEventListener('load', applyFixes);

  try {
    const observer = new MutationObserver(applySoon);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    // Stop watching after the app has settled: avoids permanent overhead.
    window.setTimeout(() => observer.disconnect(), 120000);
  } catch (err) {
    // ignore
  }
}

export default applyFixes;
