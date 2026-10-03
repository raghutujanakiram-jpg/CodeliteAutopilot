/* ==========================================================================
   Codelite AutoPilot — shared shell behaviour
   Mobile drawer · tabs · accordion · carousel · lightbox · modal ·
   toast · reveal/counters · tooltips (CSS-driven)
   ========================================================================== */
(function () {
  'use strict';

  const qs = (sel, scope) => (scope || document).querySelector(sel);
  const qsa = (sel, scope) => Array.prototype.slice.call((scope || document).querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- toast */
  const ICONS = {
    ok: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    warn: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
    error: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
  };

  function toast(message, opts) {
    const options = opts || {};
    const variant = options.variant || 'info';
    let region = qs('#toast-region');
    if (!region) {
      region = document.createElement('div');
      region.id = 'toast-region';
      region.className = 'toast-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    const el = document.createElement('div');
    el.className = 'toast toast--' + variant;
    el.innerHTML = (ICONS[variant] || ICONS.info) +
      '<div>' + (options.title ? '<strong>' + options.title + '</strong>' : '') + '<span>' + message + '</span></div>';
    region.appendChild(el);
    const life = options.duration || 5200;
    const timer = window.setTimeout(remove, life);
    function remove() {
      window.clearTimeout(timer);
      el.classList.add('is-leaving');
      el.addEventListener('animationend', function () { el.remove(); }, { once: true });
      window.setTimeout(function () { el.remove(); }, 400);
    }
    el.addEventListener('click', remove);
    return el;
  }
  window.CodeliteToast = toast;

  /* --------------------------------------------------------------- drawer */
  const drawer = qs('#site-drawer');
  const scrim = qs('#scrim');
  const navToggle = qs('#nav-toggle');

  function setDrawer(open) {
    if (!drawer) return;
    drawer.dataset.open = open ? 'true' : 'false';
    if (scrim) scrim.dataset.open = open ? 'true' : 'false';
    if (navToggle) navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('no-scroll', open);
    if (open) {
      const first = qs('.drawer__link', drawer);
      if (first) first.focus();
    } else if (navToggle) {
      navToggle.focus();
    }
  }
  if (navToggle) navToggle.addEventListener('click', function () { setDrawer(drawer.dataset.open !== 'true'); });
  if (scrim) scrim.addEventListener('click', function () { setDrawer(false); });

  const drawerClose = qs('#drawer-close');
  if (drawerClose) drawerClose.addEventListener('click', function () { setDrawer(false); });

  if (drawer) {
    qsa('.drawer__link, .drawer__contact a, .btn', drawer).forEach(function (link) {
      link.addEventListener('click', function () { if (!link.matches('[data-keep-open]')) setDrawer(false); });
    });
  }

  /* --------------------------------------------------------------- modals */
  let lastFocused = null;
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.dataset.open = 'true';
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    const focusTarget = qs('[data-autofocus]', modal) || qs('button, [href], input, select, textarea', modal);
    if (focusTarget) window.setTimeout(function () { focusTarget.focus(); }, 60);
  }
  function closeModal(modal) {
    if (!modal) return;
    modal.dataset.open = 'false';
    modal.setAttribute('aria-hidden', 'true');
    if (!qs('.modal[data-open="true"]') && !qs('.lightbox[data-open="true"]')) document.body.classList.remove('no-scroll');
    if (lastFocused) lastFocused.focus();
  }
  qsa('[data-modal-open]').forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      openModal(trigger.getAttribute('data-modal-open'));
      const step = trigger.getAttribute('data-modal-step');
      if (step) document.dispatchEvent(new CustomEvent('codelite:modal-step', { detail: { step: step, source: trigger } }));
    });
  });
  qsa('.modal').forEach(function (modal) {
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(modal); });
    qsa('[data-modal-close]', modal).forEach(function (btn) {
      btn.addEventListener('click', function () { closeModal(modal); });
    });
  });
  window.CodeliteModal = { open: openModal, close: closeModal };

  /* ------------------------------------------------------------- lightbox */
  const lightbox = qs('#lightbox');
  const lightboxImg = qs('#lightbox-img');
  const lightboxCap = qs('#lightbox-cap');

  function openLightbox(src, alt, caption) {
    if (!lightbox) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightboxCap.textContent = caption || alt || '';
    lastFocused = document.activeElement;
    lightbox.dataset.open = 'true';
    document.body.classList.add('no-scroll');
    const close = qs('#lightbox-close');
    if (close) close.focus();
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.dataset.open = 'false';
    lightboxImg.removeAttribute('src');
    closeModal(null);
    if (lastFocused) lastFocused.focus();
  }
  qsa('.media-zoom').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const img = qs('img', btn);
      if (!img) return;
      openLightbox(img.currentSrc || img.src, img.alt, btn.getAttribute('data-caption'));
    });
  });
  if (lightbox) {
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    const lbClose = qs('#lightbox-close');
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
  }

  /* ---------------------------------------------------- global key handling */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (lightbox && lightbox.dataset.open === 'true') { closeLightbox(); return; }
      const openM = qs('.modal[data-open="true"]');
      if (openM) { closeModal(openM); return; }
      if (drawer && drawer.dataset.open === 'true') setDrawer(false);
    }
    if (e.key === 'Tab') {
      const container = (lightbox && lightbox.dataset.open === 'true') ? lightbox : qs('.modal[data-open="true"]') || (drawer && drawer.dataset.open === 'true' ? drawer : null);
      if (!container) return;
      const focusables = qsa('a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])', container)
        .filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ----------------------------------------------------------------- tabs */
  qsa('[data-tabs]').forEach(function (group) {
    const tabs = qsa('[role="tab"]', group);
    const panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    function select(index, focus) {
      tabs.forEach(function (tab, i) {
        const on = i === index;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
        if (panels[i]) panels[i].hidden = !on;
      });
      if (focus && tabs[index]) tabs[index].focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i); });
      tab.addEventListener('keydown', function (e) {
        let next = null;
        if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        if (next !== null) { e.preventDefault(); select(next, true); }
      });
    });
    const initial = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
    select(initial < 0 ? 0 : initial);
  });

  /* ------------------------------------------------------------ accordion */
  qsa('.accordion').forEach(function (acc) {
    const single = acc.hasAttribute('data-single');
    qsa('.acc-item', acc).forEach(function (item) {
      const trigger = qs('.acc-trigger', item);
      const panel = qs('.acc-panel', item);
      if (!trigger || !panel) return;
      trigger.addEventListener('click', function () {
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        if (single && !expanded) {
          qsa('.acc-trigger[aria-expanded="true"]', acc).forEach(function (other) {
            other.setAttribute('aria-expanded', 'false');
            const p = document.getElementById(other.getAttribute('aria-controls'));
            if (p) p.hidden = true;
          });
        }
        trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        panel.hidden = expanded;
      });
    });
  });

  /* -------------------------------------------------------------- carousel */
  qsa('[data-carousel]').forEach(function (root) {
    const track = qs('.carousel__track', root);
    const slides = qsa('.carousel__slide', root);
    const dots = qs('.carousel__dots', root);
    if (!track || slides.length < 2) return;
    let index = 0;
    let timer = null;
    slides.forEach(function (slide, i) {
      slide.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    });
    if (dots) {
      slides.forEach(function (_, i) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel__dot';
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1) + ' of ' + slides.length);
        dot.addEventListener('click', function () { go(i); restart(); });
        dots.appendChild(dot);
      });
    }
    function go(i, focus) {
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      slides.forEach(function (s, si) { s.setAttribute('aria-hidden', si === index ? 'false' : 'true'); });
      if (dots) qsa('.carousel__dot', dots).forEach(function (d, di) { d.setAttribute('aria-current', di === index ? 'true' : 'false'); });
      if (focus) {
        const live = qs('#carousel-live');
        if (live) live.textContent = 'Slide ' + (index + 1) + ' of ' + slides.length;
      }
    }
    const prev = qs('[data-carousel-prev]', root);
    const next = qs('[data-carousel-next]', root);
    if (prev) prev.addEventListener('click', function () { go(index - 1, true); restart(); });
    if (next) next.addEventListener('click', function () { go(index + 1, true); restart(); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(index - 1, true); }
      if (e.key === 'ArrowRight') { go(index + 1, true); }
    });
    function restart() {
      if (reduceMotion || !root.hasAttribute('data-autoplay')) return;
      window.clearInterval(timer);
      timer = window.setInterval(function () { go(index + 1); }, 6500);
    }
    go(0);
    restart();
    root.addEventListener('mouseenter', function () { window.clearInterval(timer); });
    root.addEventListener('mouseleave', restart);
    let startX = null;
    root.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (startX === null) return;
      const delta = e.changedTouches[0].clientX - startX;
      if (Math.abs(delta) > 45) { go(delta < 0 ? index + 1 : index - 1, true); restart(); }
      startX = null;
    });
  });

  /* ------------------------------------------------- reveal + stat counters */
  const revealables = qsa('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
    qsa('[data-count]').forEach(function (el) { el.textContent = el.getAttribute('data-suffix') ? el.getAttribute('data-count') + el.getAttribute('data-suffix') : el.getAttribute('data-count'); });
  } else {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    revealables.forEach(function (el) { io.observe(el); });

    const countIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-count'));
        const suffix = el.getAttribute('data-suffix') || '';
        const prefix = el.getAttribute('data-prefix') || '';
        const decimals = (el.getAttribute('data-decimals') | 0);
        const duration = 1300;
        const start = performance.now();
        function frame(now) {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          const value = target * eased;
          el.textContent = prefix + value.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
          if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        countIo.unobserve(el);
      });
    }, { threshold: 0.4 });
    qsa('[data-count]').forEach(function (el) { countIo.observe(el); });
  }

  /* --------------------------------------- console bars on the hero visual */
  const consoleEl = qs('#hero-console');
  if (consoleEl) {
    const fills = qsa('.console__bar-fill', consoleEl);
    const kick = function () {
      fills.forEach(function (fill, i) {
        window.setTimeout(function () { fill.classList.add('is-on'); }, reduceMotion ? 0 : i * 220);
      });
    };
    if ('IntersectionObserver' in window) {
      const cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { kick(); cio.disconnect(); } });
      }, { threshold: 0.35 });
      cio.observe(consoleEl);
    } else { kick(); }
  }

  /* ------------------------------------------------ deep links from hash */
  const hash = window.location.hash;
  if (hash && hash.length > 1) {
    const target = document.getElementById(hash.slice(1));
    if (target) {
      window.setTimeout(function () {
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }, 90);
    }
  }

  /* ------------------------------------------------------ year in footers */
  qsa('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---------------------------------------- platform directory (theme map) */
  qsa('[data-channel-filter]').forEach(function (input) {
    const scope = document.getElementById(input.getAttribute('data-channel-filter'));
    if (!scope) return;
    const items = qsa('.channel', scope);
    const counter = qs('[data-channel-count]');
    function apply() {
      const term = input.value.trim().toLowerCase();
      let shown = 0;
      items.forEach(function (item) {
        const match = item.getAttribute('data-name').toLowerCase().indexOf(term) !== -1 ||
          (item.getAttribute('data-group') || '').toLowerCase().indexOf(term) !== -1;
        item.hidden = !match;
        if (match) shown += 1;
      });
      if (counter) counter.textContent = shown + ' of ' + items.length + ' channels shown';
      const empty = qs('[data-channel-empty]', scope);
      if (empty) empty.hidden = shown !== 0;
    }
    input.addEventListener('input', apply);
    apply();
  });
})();
