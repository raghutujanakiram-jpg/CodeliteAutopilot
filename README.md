# Codelite AutoPilot — Marketing Website

A five-page static marketing site for **Codelite AutoPilot**, the AI marketing & sales
automation product from Codelite Labs. Built as a single self-contained static site
(HTML + CSS + vanilla JS) with CDN font loading only.

- **Product:** Codelite AutoPilot — AI marketing & sales automation
- **Contact:** +91 99494 56564 · contact@codelitelabs.app
- **Studio:** Codelite Labs, Madhapur (HITEC City), Hyderabad 500081, India

---

## 1. Project goals

| Goal | How it is met |
| --- | --- |
| Present the 4-stage engine workflow (Design → Create → Connect → Auto-post) | Dedicated workflow section on Home, full stage-by-stage breakdown on Platform |
| Heavy, image-rich content that still loads fast | Locally hosted imagery, `loading="lazy"` + explicit `width`/`height` to prevent layout shift |
| Be genuinely interactive, not decorative | Every control has real state — see §4 |
| Fully responsive | Validated at 320 / 375 / 430 / 768 / 1024 / 1280 / 1440 px |

## 2. Pages and routes

All pages are static files at the site root. Shared header, footer, mobile drawer,
modals, lightbox and toast region live in every page.

| File | Purpose | Key in-page anchors |
| --- | --- | --- |
| `index.html` | Home — hero, channel marquee, stats, workflow, capabilities, engagement-model tabs, workspace carousel, ROI calculator, testimonials, deliverable gallery, FAQ, CTA | `#hero` `#workflow` `#capabilities` `#industries` `#proof` `#roi` `#customers` `#gallery` `#faq` |
| `platform.html` | Platform — the four stages in detail, filterable 12-channel directory, Connect Profiles status, auto-post execution engine, comparison table, governance | `#design` `#channels` `#connect` `#autopost` `#integrations` `#governance` |
| `solutions.html` | Solutions & pricing — 4 plans with monthly/annual toggle, 4 pre-tuned configurations, outcome stats, enterprise evaluation timeline | `#plans` `#agency` `#d2c` `#enterprise` `#pricing-faq` |
| `resources.html` | Resources — searchable/sortable/paginated 10-item playbook library with reader modal, second ROI calculator, 9-term glossary, newsletter signup | `#library` `#roi` `#glossary` `#dispatch` `#library-faq` |
| `contact.html` | Contact — three routed forms (demo / sales / support) in tabs, support SLA table, locator map illustration, contact FAQ | `#sales` `#office` `#contact-faq` |

### Deep links and routing parameters

- `contact.html#demo` · `#sales` · `#support` (also `#booking`, `#pricing`) open the
  matching contact tab. Also supported via query string: `contact.html?route=sales`.
- `resources.html#fatigue`, `#attribution`, `#agency-playbook` are referenced from
  Solutions; they land on the library and are searchable by topic.
- All other cross-page links use real anchor IDs listed above.
- Browser back/forward and hash navigation are handled natively; a hash on load is
  scrolled into view and focused for keyboard users.

## 3. File structure

```
index.html                    Home
platform.html                 Platform
solutions.html                Solutions & pricing
resources.html                Resources & ROI
contact.html                  Contact
css/style.css                 Single design system (tokens → components → responsive)
js/main.js                    Shared shell: drawer, tabs, accordion, carousel, lightbox,
                              modal, toast, reveal/counters, channel filter, focus trap
js/interactive.js             Forms, pricing toggle, ROI calculator, resource catalogue,
                              table priority toggle
js/platform.js                Platform page: asset-selection simulator
js/contact.js                 Contact page: route deep-linking
js/resources-data.js          The 10 resource articles + full body copy (in-memory data)
images/                       Brand assets and supporting imagery
```

## 4. Interactive functionality

Every interactive element listed here has real behaviour. There are no `href="#"`
placeholders and no decorative controls.

### Shared (all pages)
- **Mobile navigation drawer** — slide-in panel, scrim, focus moves to the first link,
  Escape closes, focus trap while open, focus returns to the toggle.
- **Tabs** — `role="tab"` / `role="tabpanel"`, arrow / Home / End keyboard support,
  correct roving `tabindex`.
- **Accordions** — `aria-expanded` + `aria-controls`, single-open mode via `data-single`.
- **Carousel** — prev / next buttons, dots, keyboard arrows, touch swipe, autoplay
  (paused on hover and disabled under `prefers-reduced-motion`), live region announcing
  the current slide.
- **Lightbox** — opens any `.media-zoom` image at full size with a caption; Escape or
  backdrop click closes.
- **Modals** — `role="dialog"`, `aria-modal`, focus trap, Escape, backdrop click, focus
  restore.
- **Toasts** — live-region notifications with `ok` / `info` / `warn` / `error` variants.
- **Reveal on scroll** and **animated stat counters** — both no-ops under reduced motion.

### Home
- Hero console bars animate their progress fill when scrolled into view.
- Engagement-model tabs (SME / Agency / D2C / B2B) with distinct copy, stats and imagery.
- **ROI calculator** — five sliders recompute leads, qualified leads, weighted pipeline,
  influenced revenue, net monthly gain, return on plan cost and time returned; a
  two-bar chart redraws and an `aria-live` summary sentence updates. Reset restores the
  default mid-market scenario.

### Platform
- **Design-stage simulator** — choose a deliverable and write a brief (min 15 chars,
  validated). Shows a queued → generating → completed state and names the real output
  file and format. Clear button resets the brief.
- **Channel directory filter** — free-text search across 13 channel cards, live
  "N of 13 channels shown" count and a dedicated empty state.
- **Comparison table** — "AutoPilot columns only" chip collapses the table to two
  columns for narrow screens, with `aria-pressed` state.

### Solutions
- **Monthly / annual billing switch** — updates all four plan prices to effective annual
  rates and rewrites the billing note under each plan.
- **Plan selection** — every plan CTA opens the sales modal with the plan and billing
  period pre-filled into the interest field and a pre-written message.
- Configuration tabs (Agency / D2C / B2B / SME) each carry their own defaults table.

### Resources
- **Playbook library** — 10 real articles with search, topic filter, format filter and
  four sort modes; live result count, pagination (6 per page), and an empty state whose
  reset button restores all filters.
- **Reader modal** — opens the full article body for the selected item.
- **Newsletter form** — email + interest + required consent checkbox, with a
  completion progress bar and success/error states.

### Contact
- **Three routed forms** in tabs, all with the shared validation engine.
- **Locator map** — a hand-built SVG locator illustration (no external map dependency)
  plus a "Open in Google Maps" link.

## 5. Forms and validation

A single shared engine powers every form (`form[data-lead-form]`):

- Per-field rules: required, email pattern, phone pattern (10–16 digits, `+` allowed),
  `minlength` for textareas.
- Inline `.err` messages wired with `aria-invalid` and `role="alert"`; the first invalid
  field receives focus and is scrolled into view.
- **Draft autosave** — inputs are saved to `localStorage` and restored on reload;
  cleared on successful submit or via the Clear button.
- **Required-field progress bar** on the longer forms.
- Submit lifecycle: disabled + spinner + `aria-busy`, then a success panel containing a
  generated reference (`CL-######`) and a toast.
- If the persistence endpoint is unreachable, the submission is queued in
  `localStorage` and the success panel says so explicitly rather than silently failing.
- Contact form supports `data-form-reset` to clear fields, errors and the saved draft.

## 6. Data models and storage

Two RESTful table resources are defined and written to on submit. Both include the
required `id` field.

### `leads`
| Field | Type | Notes |
| --- | --- | --- |
| `id` | text | Record identifier |
| `full_name` | text | |
| `email` | text | |
| `phone` | text | |
| `company` | text | |
| `interest` | text | Service or plan selected |
| `budget` | text | Spend band |
| `message` | text | Free text requirement |
| `source_page` | text | Page the submission came from |
| `kind` | text | enum: `demo`, `sales`, `support`, `newsletter`, `plan` |
| `status` | text | enum: `new`, `contacted`, `qualified`, `closed` |

### `subscribers`
| Field | Type | Notes |
| --- | --- | --- |
| `id` | text | Record identifier |
| `email` | text | |
| `interest` | text | Preferred content topic |
| `source_page` | text | |

**Client-side storage:** `codelite.autopilot.leads` (offline submission queue) and
`codelite.draft.<form>` (form drafts). Both are best-effort and degrade silently when
storage is unavailable.

**Persistence endpoints:** `POST tables/leads` and `POST tables/subscribers`.
Newsletter submissions route to `subscribers`, all others to `leads`.

## 7. Brand assets

Both source images are stored byte-for-byte as uploaded and referenced directly — they
are never redrawn, traced, or re-created as inline SVG or CSS.

| File | Used for | Bytes |
| --- | --- | --- |
| `images/codelite-autopilot-logo.png` | Header logo lockup (all pages), footer lockup, favicon, social/OG image | 859,133 |
| `images/codelite-workflow-guide.png` | Home workflow diagram + Contact demo panel (openable in the lightbox) | 1,130,849 |

Supporting imagery (all CC/PD-licensed, downloaded and self-hosted):
`ai-dashboard.jpg`, `analytics-kpi.jpg`, `data-analysis.jpg`, `seo-reporting.png`,
`seo-growth.jpg`, `social-strategy.jpg`, `social-marketing.jpg`, `content-flatlay.png`,
`software-office.jpg`, `agency-team.jpg`, `team-collaboration.jpg`.

## 8. Accessibility and robustness

- Semantic landmarks (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`),
  one `h1` per page, skip-to-content link.
- All controls are native `<button>` / `<a>` / `<input>` elements with accessible names.
- Visible `:focus-visible` rings; minimum 44–46 px touch targets.
- Focus trapping in modal, lightbox and drawer; Escape closes all of them.
- `aria-live` regions for toasts, the calculator summary, result counts and slide changes.
- `prefers-reduced-motion` disables marquee, reveals, counters, carousel autoplay and
  smooth scrolling.
- Reduced-motion and print stylesheets included.
- Tables use a deliberate small-screen pattern: a horizontal scroll region with a
  visible "scroll horizontally" hint, plus the priority-column toggle.

## 9. Responsive behaviour

| Breakpoint | Behaviour |
| --- | --- |
| ≤ 430 px | Header logo only (brand text hidden), single-column everything |
| ≤ 560 px | Buttons full width inside content and forms; segmented controls stretch |
| ≤ 700 px | "Talk to sales" header button hidden, footer stacks, data rows stack |
| ≤ 860 px | Top-bar status note hidden, table scroll hint shown, compact console rows |
| ≤ 1100 px | Desktop nav replaced by mobile drawer + hamburger |
| ≥ 1280 px | Content capped at the 1240 px measure, extra space distributed as whitespace |

Sizing relies on `clamp()`, `minmax()`, `auto-fit`/`auto-fill`, `aspect-ratio` and fluid
media rather than fixed pixel widths.

## 10. Not yet implemented

These are deliberate exclusions — the site is a marketing surface, not the product:

- No live product dashboard, login or account area (the product itself is not part of
  this surface).
- No real asset generation, scheduling, or channel publishing — the Platform page
  simulates the workflow states and names realistic output artifacts.
- No payment processing or checkout; plan CTAs hand off to sales.
- No server-side form handler, email delivery, CRM sync or spam protection beyond
  client-side validation.
- No blog CMS — articles live in `js/resources-data.js` as in-memory data.
- No real map embed; the locator is a hand-built SVG illustration with a Maps deep link.
- No customer-login gated content or downloadable PDF/CSV exports.
- Social links point to platform roots rather than specific Codelite profiles.

## 11. Recommended next steps

1. **Wire the forms to a real endpoint** and add server-side validation plus spam
   protection (honeypot + rate limit at minimum).
2. **Replace the in-memory resource data** with a CMS or table-backed collection so the
   marketing team can publish without a deploy.
3. **Add customer-specific social profile URLs** and a real OG/Twitter card image.
4. **Serve compressed image variants** (WebP/AVIF with `<picture>`) — the two brand PNGs
   are large source files and should be optimised for the web.
5. **Add analytics and conversion events** for demo requests, plan selections and
   calculator interactions.
6. **Self-host the font** to remove the third-party CDN dependency and improve LCP.
7. **Add a privacy policy and terms page** — the forms currently reference a privacy
   note that has no destination.
8. **Consider a case-study detail page** per testimonial once approved client stories
   and logos are available.

## 12. Local development

No build step and no dependencies. Open any `.html` file directly, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080/`. Nav links, anchors, modals and forms all work from
`file://` as well, though the table persistence calls require the site to be served over
HTTP with the API available.
