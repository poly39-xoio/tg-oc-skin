/**
 * OC skin runtime fixes.
 *
 * Runs inside the bundle because the page CSP (`script-src 'self'`) blocks inline
 * scripts. Some Telegram components set icon colours and scroll containers from
 * CSS modules injected after the main stylesheet, so a few things are enforced
 * here at the element level instead of fighting the cascade.
 */

const TAIL_SELECTORS = ['.svg-appendix', '[class*="appendix"]', '[class*="avatar-badge"]'];

function applyFixes() {
  TAIL_SELECTORS.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      if (el.dataset.ocHidden) return;
      el.dataset.ocHidden = '1';
      el.style.setProperty('display', 'none', 'important');
    });
  });

  document.querySelectorAll<HTMLElement>('.custom-scroll, [class*="scrollable"]').forEach((el) => {
    const overflowY = getComputedStyle(el).overflowY;
    if (overflowY === 'hidden' || overflowY === 'clip') {
      el.style.setProperty('overflow-y', 'auto', 'important');
    }
    el.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
  });
}

function schedule() {
  applyFixes();
  window.requestAnimationFrame(applyFixes);
  window.setTimeout(applyFixes, 500);
  window.setTimeout(applyFixes, 1500);
}


/**
 * Diagnostic snapshot of the top strip: which element actually paints the bar,
 * with its class names and background. Read from the app via `window.__ocReport()`.
 */
function collectReport() {
  const rows: string[] = [];
  document.querySelectorAll<HTMLElement>('div, header, nav, section').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.height < 20 || r.height > 160 || r.width < 150) return;
    if (r.top > 150) return;
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor;
    if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return;
    rows.push(`y${Math.round(r.top)} h${Math.round(r.height)} ${el.tagName}.${String(el.className).slice(0, 60)} bg=${bg}`);
  });
  return rows.slice(0, 20).join(' | ') || '(none)';
}

declare global {
  interface Window { __ocReport?: () => string }
}

if (typeof window !== 'undefined') {
  window.__ocReport = collectReport;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
  window.addEventListener('load', schedule);

  try {
    // eslint-disable-next-line no-new
    new MutationObserver(() => applyFixes()).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  } catch (err) {
    // MutationObserver is always available in supported browsers; ignore.
  }
}

export default applyFixes;
