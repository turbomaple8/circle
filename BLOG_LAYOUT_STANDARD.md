# Blog Layout Standard — Circle Co-Living

**Locked: 2026-05-02** — single source of truth for every blog page on circlestay.ca.

All new blog posts MUST use this pattern. Refactors of legacy pages are tracked in git history (see commit "blog layout standardization v1").

## TL;DR — Two patterns, one BEM family

| Use case | Wrapper class | Visual difference |
|---|---|---|
| Standard post (spoke / neighbourhood guide / single-topic) | `<article class="blog-post">` | Standard h1 size (2.6rem desktop), standard intro (1.15rem) |
| Pillar post (long-form, comparison tables, TOC, FAQ) | `<article class="blog-post blog-post--pillar">` | Larger h1 (2.9rem), larger intro (1.22rem); unlocks `blog-post__toc`, `blog-post__comparison-table--highlight` |

CSS lives in `styles.css` under the marker comment `Blog Post BEM Modifiers — Standardized 2026-05-02`. Do NOT add new blog-related class systems. Extend this BEM family or use existing `.blog-post p / .blog-post h2` etc. base styles.

## Canonical structure (copy-paste skeleton)

### Spoke template

```html
<!-- Article Content -->
<section class="section" style="padding-top: 8rem;">
  <div class="container" style="max-width: 800px;">
    <article class="blog-post" itemscope itemtype="https://schema.org/Article">

      <header class="blog-post__header">
        <h1 itemprop="headline">{{Article Title}}</h1>
        <p class="blog-post__intro">{{Hook paragraph — 2-4 sentences setting up the article. This is the only paragraph rendered with accent left-border + larger size.}}</p>
      </header>

      <section class="blog-post__section">
        <h2>{{First H2 heading}}</h2>
        <p>{{Body content...}}</p>
        <h3>{{Optional H3}}</h3>
        <p>{{...}}</p>
      </section>

      <section class="blog-post__section">
        <h2>{{Second H2 heading}}</h2>
        <p>{{...}}</p>
      </section>

      <!-- Repeat <section class="blog-post__section"> for each H2 -->

      <section class="blog-post__section blog-post__cta-section">
        <h2>{{CTA Heading}}</h2>
        <p>{{One sentence pitch.}}</p>
        <a href="/property-X" class="btn btn--primary">{{CTA Label}}</a>
        <p class="blog-post__disclaimer">Pricing in Canadian dollars. Weekly rates reflect available room types and are subject to availability. <a href="/apply">Apply</a> &mdash; the process is online and takes less than ten minutes.</p>
      </section>

      <!-- Optional cluster-links-block: see existing pages for pattern -->

    </article>
  </div>
</section>
```

### Pillar template

Same as spoke + `--pillar` modifier on `<article>` + optional TOC + comparison tables + FAQ section:

```html
<article class="blog-post blog-post--pillar" itemscope itemtype="https://schema.org/Article">

  <header class="blog-post__header">
    <h1 itemprop="headline">{{Pillar Title}}</h1>
    <p class="blog-post__intro">{{Pillar hook — typically 2-3 sentences with the central thesis.}}</p>
  </header>

  <!-- Optional but recommended for pillars: TOC -->
  <nav class="blog-post__toc" aria-label="Table of contents">
    <p class="blog-post__toc-label">In this guide:</p>
    <ol>
      <li><a href="#section-1">Section 1 title</a></li>
      <li><a href="#section-2">Section 2 title</a></li>
    </ol>
  </nav>

  <section id="section-1" class="blog-post__section">
    <h2>Section 1 title</h2>
    <p>{{...}}</p>

    <!-- Optional: comparison table inside a section -->
    <div class="blog-post__table-wrapper">
      <table class="blog-post__comparison-table" role="table">
        <caption class="sr-only">{{Table description for screen readers}}</caption>
        <thead>
          <tr><th>Col 1</th><th>Col 2</th></tr>
        </thead>
        <tbody>
          <tr><td>...</td><td>...</td></tr>
          <tr class="blog-post__comparison-table--highlight"><td>Highlighted row (Circle option)</td><td>...</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- Optional FAQ section -->
  <section id="faq" class="blog-post__section blog-post__section--faq" itemscope itemtype="https://schema.org/FAQPage">
    <h2>Frequently Asked Questions</h2>
    <!-- FAQ items with FAQPage schema -->
  </section>

  <section class="blog-post__section blog-post__cta-section">
    <h2>{{CTA Heading}}</h2>
    <p>{{Pitch.}}</p>
    <a href="/locations" class="btn btn--primary">{{CTA Label}}</a>
    <p class="blog-post__disclaimer">{{Disclaimer + apply link.}}</p>
  </section>

</article>
```

## The full BEM class inventory (all defined in styles.css)

| Class | Required? | Purpose |
|---|---|---|
| `.blog-post` | YES | Article wrapper. Sets typography baseline (1.08rem font, 1.85 line-height). |
| `.blog-post--pillar` | Pillar only | Larger h1 + intro. Wide-format optional. |
| `.blog-post__header` | YES | Wraps h1 + intro paragraph. |
| `.blog-post__intro` | YES | Hook paragraph with accent left-border. ONE per article — only the first paragraph after h1. |
| `.blog-post__section` | YES per H2 | Wraps each H2 + its body. Section divider line auto-applied. |
| `.blog-post__section--faq` | FAQ only | FAQ section variant. Combine with `.blog-post__section`. |
| `.blog-post__toc` | Pillar optional | Table of contents box (cream background). |
| `.blog-post__toc-label` | If TOC | TOC heading label (uppercase). |
| `.blog-post__table-wrapper` | If pillar table | Scrollable container for comparison tables. |
| `.blog-post__comparison-table` | If pillar table | Standard comparison table styling. |
| `.blog-post__comparison-table--highlight` | If table row featured | Row with accent left-border (use for Circle/recommended option). |
| `.blog-post__cta-block` | Mid-article | Inline CTA inside a section (cream box, accent border). |
| `.blog-post__cta-section` | YES | END-of-article CTA section. Always combine with `.blog-post__section`. Dark brown background, white text. |
| `.blog-post__disclaimer` | Recommended | Fine-print under CTA button (italic, low-opacity white). |

## Patterns that are FORBIDDEN going forward

These were swept out on 2026-05-02. Do NOT reintroduce:

- ❌ `class="blog-article"` / `blog-article__*` (legacy pillar pattern — removed)
- ❌ `class="blog-article-layout"` (2-column layout — superseded by single-column 800px container)
- ❌ `class="article-header"` / `article-body` / `article-meta` (early spoke pattern — removed)
- ❌ `class="post-header"` / `post-intro` / `post-meta` / `post-cta-block` (legacy unprefixed BEM — removed)
- ❌ `class="blog-cta"` (standalone CTA div — replaced by `.blog-post__cta-section`)
- ❌ `class="blog-post-footer"` (article footer — disclaimer goes inside CTA section)
- ❌ Visible `post-meta` / `article-meta` line (author + date + read time as visible text) — author + date are JSON-LD only. The visible meta line was removed for cleaner reading flow. Read-time chip can be added later as a separate component if needed.

## H1 + meta

- Always `<h1 itemprop="headline">` inside `.blog-post__header`. No class on the h1 itself — sizing comes from `.blog-post__header h1`.
- Author + datePublished + dateModified live in JSON-LD `<script type="application/ld+json">` only.

## CTA section rules

- Wrap in `<section class="blog-post__section blog-post__cta-section">` (BOTH classes).
- H2 (not H3) for CTA heading — the section is a top-level article concern.
- One primary `<a class="btn btn--primary">` per CTA section.
- Disclaimer paragraph uses `.blog-post__disclaimer` and goes INSIDE the CTA section.
- For internal links inside the CTA section, no class needed — they auto-style with accent-light color on dark background.

## SEO requirements (parallel to layout)

These are required regardless of layout, but listed here for completeness:

1. `<title>` and `<meta name="description">` per CLAUDE.md SEO system
2. `<link rel="canonical">` to absolute URL
3. OpenGraph + Twitter Cards meta tags
4. JSON-LD with Organization + Article + BreadcrumbList (using `@graph` + `@id` linking)
5. Body-level GTM + GA4 + Meta Pixel (already in template)
6. Preconnect to fonts.googleapis.com + fonts.gstatic.com
7. `loading="lazy" decoding="async"` on below-fold images (hero excluded)
8. Cluster-links-block at end of article (inside `</article>`) — rendered after CTA section, before footer

## Refactor history

- **2026-05-02:** Initial standardization. 6 legacy patterns swept (`blog-article`, `article-header`/`article-body`, `post-header`/`post-intro`, `blog-cta`, `blog-post-footer`, raw-wrapped `<article>`). All 14 blog pages migrated to canonical `.blog-post` BEM. CSS BEM modifiers added to `styles.css` (lines ~2331-2520). See git commit log.

## When in doubt

Use [queen-west-neighbourhood-guide.html](blog/queen-west-neighbourhood-guide.html) as the canonical SPOKE reference and [young-professional-housing-toronto-guide.html](blog/young-professional-housing-toronto-guide.html) as the canonical PILLAR reference.

If a new content pattern is genuinely needed (e.g., recipe card, comparison matrix, calculator widget), propose it as a new `.blog-post__{name}` class in `styles.css` AND document it here. No standalone class systems outside `.blog-post__*`.
