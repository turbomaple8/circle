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
├── styles.css              # Single stylesheet — all styles
├── script.js               # Single JS file — nav, modals, forms, animations
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

1. **Distillery District** — 25 Mill St
2. **Queen West** — 920 Queen St W
3. **Yonge & Eglinton** — 2300 Yonge St
4. **York & Bremner** — 23 York St

## Deployment

- Push to `main` → Vercel auto-deploys to production
- Production URL: https://circle-nu-orcin.vercel.app (custom domain to be added)
- No build command needed — Vercel serves static files directly

## Working on This Project

- Edit HTML/CSS/JS files directly — no compilation needed
- Test locally by opening `index.html` in a browser (or use a local server)
- The CSS comment at the top still says "LIEVE" (original brand name before rebranding to Circle) — this is cosmetic only
- When adding new properties, follow the `property-*.html` template pattern
- When modifying forms, update both the modal HTML and the handler in `script.js`
