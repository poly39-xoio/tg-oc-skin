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
