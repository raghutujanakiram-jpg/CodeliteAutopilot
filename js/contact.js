/* ==========================================================================
   Codelite AutoPilot — contact page helpers
   Route deep-linking (?route=sales|support|demo) and hash-driven tab focus.
   ========================================================================== */
(function () {
  'use strict';

  const qs = (s, scope) => (scope || document).querySelector(s);
  const qsa = (s, scope) => Array.prototype.slice.call((scope || document).querySelectorAll(s));

  const TABS = [
    { id: 'ct-demo', panel: 'ctp-demo', hashes: ['demo', 'booking'], params: ['demo', 'booking'] },
    { id: 'ct-sales', panel: 'ctp-sales', hashes: ['sales', 'pricing'], params: ['sales'] },
    { id: 'ct-support', panel: 'ctp-support', hashes: ['support'], params: ['support'] }
  ];

  function activate(id) {
    const tab = document.getElementById(id);
    if (tab) {
      tab.click();
      const section = qs('#sales');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    }
    return false;
  }

  function routeFromLocation() {
    const hash = (window.location.hash || '').replace('#', '').toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const route = (params.get('route') || '').toLowerCase();
    const wanted = [hash, route].filter(Boolean);
    for (const key of wanted) {
      const match = TABS.find((t) => t.hashes.indexOf(key) !== -1 || t.params.indexOf(key) !== -1);
      if (match) return activate(match.id);
    }
    return false;
  }

  routeFromLocation();
  window.addEventListener('hashchange', routeFromLocation);

  /* The demo modal's "go to form" button needs a real anchor target. */
  qsa('[data-modal-open="demo-form-anchor"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const demo = document.getElementById('ct-demo');
      if (demo) demo.click();
      const field = document.getElementById('d-name');
      if (field) window.setTimeout(() => { field.scrollIntoView({ block: 'center', behavior: 'smooth' }); field.focus(); }, 260);
    });
  });
})();
