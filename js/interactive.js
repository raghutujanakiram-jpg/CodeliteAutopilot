/* ==========================================================================
   Codelite AutoPilot — page widgets
   lead forms · pricing toggle · ROI calculator · resource catalogue
   ========================================================================== */
(function () {
  'use strict';

  const qs = (s, scope) => (scope || document).querySelector(s);
  const qsa = (s, scope) => Array.prototype.slice.call((scope || document).querySelectorAll(s));
  const toast = window.CodeliteToast || function () {};
  const money = (n) => '\u20B9' + Math.round(n).toLocaleString('en-IN');
  const STORE = 'codelite.autopilot.leads';

  /* ======================================================================
     1. FORMS — validation, drafts, submit, states
     ====================================================================== */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  const PHONE_RE = /^[+]?[\d\s\-()]{10,16}$/;

  function readQueue() {
    try { return JSON.parse(window.localStorage.getItem(STORE) || '[]'); } catch (e) { return []; }
  }
  function writeQueue(rows) {
    try { window.localStorage.setItem(STORE, JSON.stringify(rows)); } catch (e) { /* storage unavailable */ }
  }
  function stash(row) {
    const rows = readQueue();
    rows.push({ row: row, at: new Date().toISOString() });
    writeQueue(rows);
  }
  async function postTable(table, row) {
    const res = await fetch('tables/' + table, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  function setFieldError(field, message) {
    const control = qs('input, select, textarea', field);
    const err = qs('.err', field);
    if (!control || !err) return;
    if (message) {
      control.setAttribute('aria-invalid', 'true');
      err.textContent = message;
      err.setAttribute('role', 'alert');
    } else {
      control.removeAttribute('aria-invalid');
      err.textContent = '';
      err.removeAttribute('role');
    }
  }

  qsa('form[data-lead-form]').forEach((form) => {
    const fields = qsa('.field', form);
    const status = qs('[data-form-status]', form);
    const submit = qs('[type="submit"]', form);
    const kind = form.getAttribute('data-kind') || 'sales';
    const progress = qs('[data-form-progress]', form);
    const progressFill = progress ? qs('.form-progress__fill', progress) : null;
    const progressText = progress ? qs('[data-form-progress-text]', progress) : null;
    const draftKey = 'codelite.draft.' + (form.id || kind);

    // restore draft
    try {
      const draft = JSON.parse(window.localStorage.getItem(draftKey) || 'null');
      if (draft) {
        Object.keys(draft).forEach((name) => {
          const input = form.elements[name];
          if (!input) return;
          if (input.type === 'checkbox') input.checked = !!draft[name];
          else input.value = draft[name];
        });
      }
    } catch (e) { /* ignore */ }

    function saveDraft() {
      const data = {};
      qsa('input, select, textarea', form).forEach((el) => {
        if (!el.name || el.type === 'hidden') return;
        if (el.type === 'checkbox') data[el.name] = el.checked;
        else if (el.type !== 'file') data[el.name] = el.value;
      });
      try { window.localStorage.setItem(draftKey, JSON.stringify(data)); } catch (e) { /* ignore */ }
    }

    function reportProgress() {
      if (!progressFill) return;
      const required = qsa('[required]', form);
      const filled = required.filter((el) => {
        if (el.type === 'checkbox') return el.checked;
        return String(el.value || '').trim().length > 0;
      }).length;
      const pct = required.length ? Math.round((filled / required.length) * 100) : 0;
      progressFill.style.width = pct + '%';
      if (progressText) progressText.textContent = filled + ' of ' + required.length + ' required fields complete (' + pct + '%)';
    }

    qsa('input, select, textarea', form).forEach((el) => {
      el.addEventListener('input', () => {
        const field = el.closest('.field');
        if (field) setFieldError(field, '');
        if (status) status.hidden = true;
        reportProgress();
        saveDraft();
      });
      el.addEventListener('blur', () => {
        if (el.hasAttribute('required') || String(el.value).trim() !== '') validateField(el, false);
      });
    });
    reportProgress();

    function validateField(el, loud) {
      const field = el.closest('.field');
      if (!field) return true;
      const value = String(el.value || '').trim();
      let message = '';
      if (el.hasAttribute('required') && !value && el.type !== 'checkbox') message = 'This field is required.';
      else if (el.type === 'checkbox' && el.hasAttribute('required') && !el.checked) message = 'Please confirm to continue.';
      else if (value && el.type === 'email' && !EMAIL_RE.test(value)) message = 'Enter a valid email such as name@company.com.';
      else if (value && el.type === 'tel' && !PHONE_RE.test(value)) message = 'Enter a valid phone number (10-16 digits, + allowed).';
      else if (value && el.name === 'phone' && el.type !== 'tel' && !PHONE_RE.test(value)) message = 'Enter a valid phone number or leave it blank.';
      else if (value && el.minLength > 0 && value.length < el.minLength) message = 'Please use at least ' + el.minLength + ' characters.';
      setFieldError(field, message);
      return !message;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const controls = qsa('input, select, textarea', form).filter((el) => el.type !== 'hidden');
      let firstBad = null;
      controls.forEach((el) => { if (!validateField(el, true) && !firstBad) firstBad = el; });
      if (firstBad) {
        if (status) {
          status.hidden = false;
          status.className = 'note note--error form-status';
          status.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v5m0 3h.01"/></svg><span>Some details still need attention. Check the highlighted fields above.</span>';
        }
        firstBad.focus();
        firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }

      const original = submit ? submit.innerHTML : '';
      if (submit) {
        submit.disabled = true;
        submit.setAttribute('aria-busy', 'true');
        submit.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Securing your request…</span>';
      }
      if (status) { status.hidden = true; }

      const data = {};
      new FormData(form).forEach((value, key) => {
        if (typeof value === 'string') data[key] = value.trim();
      });
      const row = Object.assign({}, data, {
        kind: kind,
        status: 'new',
        source_page: window.location.pathname.split('/').pop() || 'index.html'
      });
      Object.keys(row).forEach((k) => { if (row[k] === '' ) delete row[k]; });

      let stored = false;
      try {
        await postTable(kind === 'newsletter' ? 'subscribers' : 'leads', row);
        stored = true;
      } catch (err) {
        stash(row);
      }

      await new Promise((r) => window.setTimeout(r, 620));

      if (submit) {
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
        submit.innerHTML = original;
      }

      if (status) {
        status.hidden = false;
        status.className = 'note note--ok form-status';
        const ref = 'CL-' + Date.now().toString().slice(-6);
        status.innerHTML =
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span><strong>Request received — reference ' + ref + '.</strong> ' +
          (kind === 'newsletter'
            ? 'You are on the list. The next Codelite dispatch lands in your inbox within a week.'
            : 'A solutions engineer replies within one business day. For anything urgent call 99494 56564.') +
          (stored ? '' : ' <em>Saved locally and queued for sync because the secure endpoint is unavailable in this preview.</em>') +
          '</span>';
      }
      toast(kind === 'newsletter' ? 'Subscription confirmed. Reference ' + 'CL-' + Date.now().toString().slice(-6) + '.' : 'Request submitted — we will respond within one business day.', { variant: 'ok', title: 'Thank you!' });

      try { window.localStorage.removeItem(draftKey); } catch (e) { /* ignore */ }
      form.reset();
      reportProgress();
      const live = qs('[data-form-success-anchor]');
      if (live) live.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });

    const resetBtn = qs('[data-form-reset]', form);
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        form.reset();
        fields.forEach((f) => setFieldError(f, ''));
        if (status) status.hidden = true;
        reportProgress();
        try { window.localStorage.removeItem(draftKey); } catch (e) { /* ignore */ }
        toast('Form cleared.', { variant: 'info' });
      });
    }
  });

  /* ======================================================================
     2. PRICING — monthly / annual toggle + plan selection
     ====================================================================== */
  qsa('[data-billing-toggle]').forEach((switchEl) => {
    const scope = document.getElementById(switchEl.getAttribute('data-billing-toggle'));
    const labels = qsa('[data-price-amount]', scope);
    const notes = qsa('[data-price-note]', scope);
    const apply = () => {
      const annual = switchEl.checked;
      labels.forEach((el) => {
        el.textContent = '\u20B9' + (annual ? el.getAttribute('data-annual') : el.getAttribute('data-monthly'));
      });
      notes.forEach((el) => {
        el.textContent = annual
          ? 'Billed annually — effective \u20B9' + el.getAttribute('data-annual') + ' / month, 2 months free.'
          : 'Billed monthly. Cancel anytime. GST extra.';
      });
      qsa('[data-billing-label]', scope).forEach((el) => {
        el.textContent = annual ? 'Annual billing' : 'Monthly billing';
      });
    };
    switchEl.addEventListener('change', apply);
    apply();
  });

  qsa('[data-plan-select]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const plan = btn.getAttribute('data-plan-select');
      const billing = qs('#billing-switch');
      const period = billing && billing.checked ? 'Annual' : 'Monthly';
      const interest = qs('#interest');
      const message = qs('#message');
      if (!interest) {
        toast(plan + ' plan (' + period + ') selected — open the talk-to-sales form to confirm.', { variant: 'info', title: 'Plan selected' });
        return;
      }
      interest.value = 'plan';
      if (message && !message.value.trim()) {
        message.value = 'I would like to start on the ' + plan + ' plan with ' + period.toLowerCase() + ' billing. Please share onboarding steps and a GST invoice.';
      }
      window.CodeliteModal.open('sales-modal');
      toast(plan + ' plan (' + period + ') pre-filled in the sales form.', { variant: 'ok', title: 'Plan ready' });
    });
  });

  /* ======================================================================
     3. ROI CALCULATOR
     ====================================================================== */
  const calc = qs('#roi-calculator');
  if (calc) {
    const inputs = {
      spend: qs('#calc-spend'),
      cpl: qs('#calc-cpl'),
      closure: qs('#calc-closure'),
      value: qs('#calc-value'),
      hours: qs('#calc-hours')
    };
    const outs = {
      spend: qs('#calc-spend-out'),
      cpl: qs('#calc-cpl-out'),
      closure: qs('#calc-closure-out'),
      value: qs('#calc-value-out'),
      hours: qs('#calc-hours-out')
    };
    const result = {
      pipeline: qs('#calc-result-pipeline'),
      leads: qs('#calc-result-leads'),
      qualified: qs('#calc-result-qualified'),
      revenue: qs('#calc-result-revenue'),
      efficiency: qs('#calc-result-efficiency'),
      saved: qs('#calc-result-saved'),
      roi: qs('#calc-result-roi'),
      summary: qs('#calc-summary')
    };

    function compute() {
      const spend = +inputs.spend.value;
      const cpl = +inputs.cpl.value;
      const closure = +inputs.closure.value / 100;
      const value = +inputs.value.value;
      const hours = +inputs.hours.value;

      outs.spend.textContent = money(spend);
      outs.cpl.textContent = money(cpl);
      outs.closure.textContent = (+inputs.closure.value).toFixed(0) + '%';
      outs.value.textContent = money(value);
      outs.hours.textContent = hours + ' h / week';

      // AutoPilot assumptions
      const QUALITY_LIFT = 0.32;   // more qualified leads on the same spend
      const CLOSURE_LIFT = 1.18;   // better nurture improves close rate
      const TIME_SHRINK = 0.62;    // manual work removed
      const SUBSCRIPTION = 24900;  // Growth plan, monthly

      const baseLeads = spend / Math.max(cpl, 1);
      const leads = baseLeads * (1 + QUALITY_LIFT);
      const baseQualified = baseLeads * closure;
      const qualified = leads * Math.min(closure * CLOSURE_LIFT, 0.95);
      const baseRevenue = baseQualified * value;
      const revenue = qualified * value;
      const pipeline = leads * value * 0.35;
      const hoursSaved = hours * TIME_SHRINK;
      const hourlyRate = 850;
      const timeValue = hoursSaved * 4.33 * hourlyRate;
      const efficiency = (timeValue + (revenue - baseRevenue)) / SUBSCRIPTION;

      result.pipeline.textContent = money(pipeline);
      result.leads.textContent = Math.round(leads).toLocaleString('en-IN');
      result.qualified.textContent = Math.round(qualified).toLocaleString('en-IN');
      result.revenue.textContent = money(revenue);
      result.efficiency.textContent = efficiency.toFixed(1) + '\u00D7';
      result.saved.textContent = hoursSaved.toFixed(1) + ' h / week';
      result.roi.textContent = money(revenue - baseRevenue - SUBSCRIPTION);
      result.summary.textContent = 'At ' + money(spend) + ' monthly ad spend and a ' + (+inputs.closure.value).toFixed(0) +
        '% close rate, AutoPilot models ' + Math.round(leads) + ' leads and ' + money(revenue) +
        ' in influenced revenue — about ' + money(revenue - baseRevenue - SUBSCRIPTION) + ' net of the Growth plan.';

      const bars = [
        { label: 'Manual only', value: baseRevenue, cls: 'is-base' },
        { label: 'With AutoPilot', value: revenue, cls: 'is-auto' }
      ];
      const max = Math.max(baseRevenue, revenue) || 1;
      const chart = qs('#calc-chart');
      if (chart) {
        chart.innerHTML = bars.map((b) => (
          '<div class="calc-bar">' +
            '<span class="calc-bar__label">' + b.label + '</span>' +
            '<span class="calc-bar__track"><span class="calc-bar__fill ' + b.cls + '" style="width:' + Math.round((b.value / max) * 100) + '%"></span></span>' +
            '<span class="calc-bar__value">' + money(b.value) + '</span>' +
          '</div>'
        )).join('');
      }
    }

    Object.keys(inputs).forEach((k) => {
      if (inputs[k]) inputs[k].addEventListener('input', compute);
    });
    compute();

    const resetCalc = qs('#calc-reset');
    if (resetCalc) {
      resetCalc.addEventListener('click', () => {
        inputs.spend.value = 150000;
        inputs.cpl.value = 320;
        inputs.closure.value = 22;
        inputs.value.value = 48000;
        inputs.hours.value = 26;
        compute();
        toast('Calculator reset to the default mid-market scenario.', { variant: 'info' });
      });
    }
  }

  /* ======================================================================
     4. RESOURCE CATALOGUE — search, topic filter, sort, pagination
     ====================================================================== */
  const catalogue = qs('#resource-catalogue');
  if (catalogue) {
    const data = window.CODELITE_RESOURCES || [];
    const searchInput = qs('#resource-search');
    const topicSelect = qs('#resource-topic');
    const typeSelect = qs('#resource-type');
    const sortSelect = qs('#resource-sort');
    const grid = qs('#resource-grid');
    const countEl = qs('#resource-count');
    const emptyEl = qs('#resource-empty');
    const pager = qs('#resource-pagination');
    const perPage = 6;
    let page = 1;

    function filtered() {
      const term = (searchInput.value || '').trim().toLowerCase();
      const topic = topicSelect.value;
      const type = typeSelect.value;
      let rows = data.filter((r) => {
        const hay = (r.title + ' ' + r.summary + ' ' + r.topic + ' ' + r.author).toLowerCase();
        const okTerm = !term || hay.indexOf(term) !== -1;
        const okTopic = topic === 'all' || r.topic === topic;
        const okType = type === 'all' || r.type === type;
        return okTerm && okTopic && okType;
      });
      const sort = sortSelect.value;
      rows = rows.slice();
      if (sort === 'newest') rows.sort((a, b) => (a.order - b.order));
      if (sort === 'oldest') rows.sort((a, b) => (b.order - a.order));
      if (sort === 'title') rows.sort((a, b) => a.title.localeCompare(b.title));
      if (sort === 'read') rows.sort((a, b) => a.minutes - b.minutes);
      return rows;
    }

    function render() {
      const rows = filtered();
      const pages = Math.max(1, Math.ceil(rows.length / perPage));
      if (page > pages) page = pages;
      const slice = rows.slice((page - 1) * perPage, page * perPage);

      grid.innerHTML = slice.map((r) => (
        '<article class="article reveal is-visible">' +
          '<div class="article__media"><img src="' + r.image + '" alt="' + r.imageAlt + '" loading="lazy" width="640" height="400"></div>' +
          '<div class="article__body">' +
            '<div class="chip-row"><span class="badge badge--orange">' + r.topic + '</span><span class="badge">' + r.type + '</span></div>' +
            '<h4>' + r.title + '</h4>' +
            '<p>' + r.summary + '</p>' +
            '<div class="article__meta"><span>' + r.author + '</span><span aria-hidden="true">•</span><span>' + r.minutes + ' min read</span></div>' +
            '<button class="btn btn--outline btn--sm" type="button" data-article-open="' + r.id + '">Read the playbook</button>' +
          '</div>' +
        '</article>'
      )).join('');

      countEl.textContent = rows.length === 0
        ? 'No results'
        : 'Showing ' + ((page - 1) * perPage + 1) + '–' + Math.min(page * perPage, rows.length) + ' of ' + rows.length + ' resources';
      emptyEl.hidden = rows.length !== 0;

      pager.innerHTML = '';
      if (rows.length > perPage) {
        const mk = (label, target, opts) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.innerHTML = label;
          if (opts && opts.current) b.setAttribute('aria-current', 'true');
          if (opts && opts.disabled) b.disabled = true;
          b.setAttribute('aria-label', opts && opts.label ? opts.label : label.replace(/<[^>]+>/g, ''));
          b.addEventListener('click', () => { page = target; render(); grid.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
          pager.appendChild(b);
        };
        mk('&larr; Prev', page - 1, { disabled: page === 1, label: 'Previous page' });
        for (let i = 1; i <= pages; i += 1) mk(String(i), i, { current: i === page, label: 'Page ' + i });
        mk('Next &rarr;', page + 1, { disabled: page === pages, label: 'Next page' });
      }

      qsa('[data-article-open]', grid).forEach((btn) => {
        btn.addEventListener('click', () => {
          const r = data.find((x) => x.id === btn.getAttribute('data-article-open'));
          if (!r) return;
          const dlgTitle = qs('#article-modal-title');
          const dlgBody = qs('#article-modal-body');
          const dlgImg = qs('#article-modal-img');
          dlgTitle.textContent = r.title;
          dlgImg.src = r.image;
          dlgImg.alt = r.imageAlt;
          dlgBody.innerHTML = '<p><strong>' + r.topic + ' · ' + r.type + ' · ' + r.minutes + ' min read</strong></p>' +
            '<p>' + r.summary + '</p>' +
            r.body.map((p) => '<p>' + p + '</p>').join('') +
            '<div class="note"><span>Written by ' + r.author + ', Codelite Labs. For a walkthrough of this playbook on your own funnel, request a demo or call 99494 56564.</span></div>';
          window.CodeliteModal.open('article-modal');
        });
      });
    }

    [searchInput, topicSelect, typeSelect, sortSelect].forEach((el) => {
      el.addEventListener('input', () => { page = 1; render(); });
      el.addEventListener('change', () => { page = 1; render(); });
    });
    function resetFilters() {
      searchInput.value = '';
      topicSelect.value = 'all';
      typeSelect.value = 'all';
      sortSelect.value = 'newest';
      page = 1;
      render();
      searchInput.focus();
      toast('Filters cleared — showing the full library.', { variant: 'info' });
    }
    const clear = qs('#resource-clear');
    if (clear) clear.addEventListener('click', resetFilters);
    const emptyReset = qs('#resource-empty-reset');
    if (emptyReset) emptyReset.addEventListener('click', resetFilters);
    render();
  }

  /* ======================================================================
     5. MOBILE-FIRST TABLE PATTERN — priority column switcher
     ====================================================================== */
  qsa('[data-table-priority]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const table = document.getElementById(btn.getAttribute('data-table-priority'));
      if (!table) return;
      const on = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', on ? 'false' : 'true');
      table.classList.toggle('is-priority', !on);
      toast(!on ? 'Showing AutoPilot columns only.' : 'Showing the full comparison.', { variant: 'info' });
    });
  });

  /* ======================================================================
     6. DEMO TIMELINE PREVIEW (modal step jump)
     ====================================================================== */
  document.addEventListener('codelite:modal-step', (e) => {
    const step = e.detail.step;
    const list = qs('#demo-timeline');
    if (!list) return;
    qsa('.timeline__item', list).forEach((item) => {
      item.classList.toggle('is-active', item.getAttribute('data-step') === step);
    });
  });
})();
