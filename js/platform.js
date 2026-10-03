/* ==========================================================================
   Codelite AutoPilot — platform page widgets
   Asset-selection simulator (Design stage)
   ========================================================================== */
(function () {
  'use strict';

  const qs = (s, scope) => (scope || document).querySelector(s);
  const toast = window.CodeliteToast || function () {};

  const run = qs('#gen-run');
  if (!run) return;

  const select = qs('#gen-asset');
  const brief = qs('#gen-brief');
  const status = qs('#gen-status');
  const statusText = qs('#gen-status-text');
  const clear = qs('#gen-clear');

  const LABELS = {
    logo: { name: 'Logo system & lockups', out: 'kettle-and-co-logo-system.zip', detail: '12 lockup variants, SVG + PNG + CMYK PDF' },
    landing: { name: 'Website landing page', out: 'kettle-and-co-landing.html', detail: '6 responsive sections with copy blocks' },
    card: { name: 'Business card', out: 'kettle-and-co-card-print.pdf', detail: '90 × 54 mm, 3 mm bleed, CMYK' },
    'digital-card': { name: 'Digital business card', out: 'kettle-and-co-digital-card.vcf', detail: 'Tap-to-save vCard with brand header' },
    note: { name: 'Note card', out: 'kettle-and-co-note-card.pdf', detail: 'A6 with thank-you copy variants' },
    letterhead: { name: 'Letterhead', out: 'kettle-and-co-letterhead.docx', detail: 'A4 with GST and address block' },
    signature: { name: 'Email signature', out: 'signature.html', detail: 'Table-safe HTML for Outlook and Gmail' },
    invoice: { name: 'Invoice template', out: 'kettle-and-co-invoice.xlsx', detail: 'GST-compliant with HSN column' },
    animation: { name: 'Short animation', out: 'kettle-and-co-reveal.mp4', detail: '9:16 and 1:1, 8 seconds, silent' }
  };

  function preview() {
    const meta = LABELS[select.value];
    if (!meta || !statusText) return;
    statusText.innerHTML = 'Ready to generate <strong>' + meta.name + '</strong> — expected output <code>' + meta.out + '</code> (' + meta.detail + '). Press <strong>Select asset</strong> to queue the job.';
  }

  select.addEventListener('change', preview);
  preview();

  run.addEventListener('click', async () => {
    const meta = LABELS[select.value];
    const text = (brief.value || '').trim();
    if (text.length < 15) {
      brief.setAttribute('aria-invalid', 'true');
      status.className = 'note note--warn';
      statusText.innerHTML = 'The brief needs at least 15 characters so the generator can pick tone and composition. Add a little direction and try again.';
      brief.focus();
      toast('Add a longer creative brief before generating.', { variant: 'warn', title: 'Brief too short' });
      return;
    }
    brief.removeAttribute('aria-invalid');

    run.disabled = true;
    run.setAttribute('aria-busy', 'true');
    const original = run.innerHTML;
    run.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Queued…</span>';
    status.className = 'note';
    statusText.innerHTML = 'Queuing <strong>' + meta.name + '</strong> against your approved palette and type lock…';

    await new Promise((r) => window.setTimeout(r, 950));

    run.disabled = false;
    run.removeAttribute('aria-busy');
    run.innerHTML = original;

    status.className = 'note note--ok';
    statusText.innerHTML = '<strong>Job complete.</strong> ' + meta.name + ' generated as <code>' + meta.out + '</code> · ' +
      meta.detail + '. Added to the workspace asset library with version 1.0 — review, request changes, or publish straight to a channel.';
    toast(meta.name + ' generated and added to the asset library.', { variant: 'ok', title: 'Generation complete' });
  });

  if (clear) {
    clear.addEventListener('click', () => {
      brief.value = '';
      brief.removeAttribute('aria-invalid');
      status.className = 'note';
      statusText.textContent = 'Brief cleared. Describe the direction you want — tone, setting, product and lighting all help the generator.';
      brief.focus();
    });
  }
})();
