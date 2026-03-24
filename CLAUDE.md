# Circle — Co-Living in Toronto

## What is Circle?

Circle is a co-living brand in Toronto for students and young professionals. The website is a marketing/lead-gen site showcasing properties, community values, and capturing applications + viewing requests.

## Tech Stack

- **Pure static site** — HTML, CSS, vanilla JS. No framework, no build step.
- **Hosting**: Vercel (auto-deploys from `main` branch on GitHub)
- **Repo**: https://github.com/turbomaple8/circle
- **Forms**: FormSubmit.co (sends to `info@circle.co`)
- **Fonts**: Google Fonts — Cormorant Garamond (headings), DM Sans (body)
- **Images**: Mix of local files and Unsplash CDN URLs

## Project Structure

```
/
├── index.html              # Homepage — hero, featured rooms, community, FAQ
├── about.html              # About page — mission, values, team
├── locations.html          # All properties overview
├── property-distillery.html # Property detail — Distillery District
├── property-queen.html     # Property detail — Queen West
├── property-yonge.html     # Property detail — Yonge & Eglinton
├── property-york.html      # Property detail — York & Bremner
├── privacy.html            # Privacy policy
├── terms.html              # Terms of service
├── styles.css              # Single stylesheet - all styles
├── script.js               # Single JS file - nav, modals, forms, animations
├── sitemap.xml             # XML sitemap for search engines
├── robots.txt              # Crawler directives
├── building-*.jpg/webp     # Property hero images (local)
├── room-coliving.jpg       # Room type image
└── .vercel/                # Vercel project config (gitignored)
```

## Design System

- **Color palette**: Warm earthy tones — primary brown `#6B4C3B`, accent terracotta `#C4876B`, cream backgrounds `#F5EDE4`, sage green `#7A8B6F`
- **CSS naming**: BEM convention (`nav__logo`, `hero__mosaic-img`, `modal-overlay`)
- **Animations**: Intersection Observer fade-ins (`.fade-in` → `.visible`)
- **Modals**: Two modals — tour booking (`tourModal`) and application (`applyModal`), triggered via `data-modal` attributes
- **Responsive**: Mobile-first with hamburger menu, breakpoints in CSS

## Key Patterns

- Navigation scrolls to add `.nav--scrolled` class after 40px
- Mobile menu toggled via `.nav__hamburger` button
- All forms use `FormSubmit.co` POST to `info@circle.co` with table template
- Form success replaces form HTML inline with a confirmation message
- Smooth scroll for anchor links (`#section`)
- Property pages follow a consistent template structure

## Properties (Current Listings)

1. **The York** - 12 & 14 York Street (Waterfront / Financial District)
2. **The Queen** - 215 Queen Street West (Queen West / Entertainment District)
3. **The Distillery** - 70 Mill Street (Distillery District / Corktown)
4. **The Yonge** - 197 Yonge Street (Downtown Core / Eaton Centre)
5. **The Maddox** - 201 Sherbourne Street (Garden District / Cabbagetown) - listed but no property page yet
6. **The Wellesley** - 100 Wellesley Street East (Church-Wellesley) - listed but no property page yet

## Deployment

- Push to `main` → Vercel auto-deploys to production
- Production URL: https://circle-nu-orcin.vercel.app (custom domain to be added)
- No build command needed — Vercel serves static files directly

## SEO System

All SEO is implemented inline in each HTML file. No build step or JS generation needed.

### Files
- `sitemap.xml` - Lists all 9 pages with lastmod, priority, changefreq
- `robots.txt` - Allows all crawlers, blocks `.vercel/` and `CLAUDE.md`, references sitemap

### Per-Page SEO (all 9 HTML files)
- **Canonical tags** - `<link rel="canonical">` on every page pointing to Vercel production URL
- **OpenGraph tags** - og:type, og:url, og:title, og:description, og:image, og:site_name
- **Twitter Cards** - summary_large_image for main pages, summary for legal pages
- **JSON-LD structured data** using `@graph` pattern with `@id` entity linking:
  - `Organization` (shared across pages via @id reference)
  - `WebSite` (homepage only)
  - `LocalBusiness` (each property page, with address + geo coordinates)
  - `BreadcrumbList` (every page: Home > Section > Page)
- **Font preconnect** - `preconnect` to fonts.googleapis.com and fonts.gstatic.com
- **Lazy loading** - `loading="lazy" decoding="async"` on below-fold images (hero/above-fold images excluded)

### When Adding New Properties
1. Copy an existing `property-*.html` as template
2. Update all meta tags (title, description, canonical, OG, Twitter)
3. Update JSON-LD: LocalBusiness name/description/address/geo/priceRange, BreadcrumbList
4. Add the new page to `sitemap.xml`
5. Ensure `loading="lazy" decoding="async"` on below-fold images

### Base URL
All canonical/OG URLs use `https://circle-nu-orcin.vercel.app`. When a custom domain is added, find-and-replace this across all HTML files and sitemap.xml.

## Working on This Project

- Edit HTML/CSS/JS files directly - no compilation needed
- Test locally by opening `index.html` in a browser (or use a local server)
- The CSS comment at the top still says "LIEVE" (original brand name before rebranding to Circle) - this is cosmetic only
- When adding new properties, follow the `property-*.html` template pattern and the SEO checklist above
- When modifying forms, update both the modal HTML and the handler in `script.js`
