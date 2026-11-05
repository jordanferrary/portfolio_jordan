# Jordan Ferrary — React Portfolio

A modular, responsive React portfolio built with Vite, React Router and Lucide icons.

## Requirements
- Node.js 18.18+ (Node 20 LTS recommended)
- npm

## Run locally

```bash
npm install
npm run dev
```

Create a production build:

```bash
npm run build
npm run preview
```

## Routes
- `/` — Home / featured work carousel
- `/portfolio` — Filterable portfolio gallery
- `/project/:slug` — Reusable project detail template
- `/about` — About page

## Add or edit projects

Edit `src/data/projects.js`. Each project should have a unique `slug`, title, category, cover image, description, role, software list and gallery array.

The home carousel uses entries with `featured: true`. The gallery automatically includes every project.

## Replace placeholder images

The current images are visual placeholders from Unsplash and are not Jordan's final artwork. Replace the `cover` and `gallery` URLs in `src/data/projects.js` with your own optimized image paths, ideally stored in `public/assets/projects/`.

Example:

```js
cover: "/assets/projects/shark/shark-main.webp",
gallery: [
  "/assets/projects/shark/shark-main.webp",
  "/assets/projects/shark/shark-detail-01.webp"
]
```

Recommended export formats:
- WebP or AVIF for portfolio images
- 1800–2400 px wide for hero / project covers
- 1200–1600 px wide for gallery details
- Keep each image reasonably compressed

## Social links

Edit the destinations in `src/components/layout/Sidebar.jsx` and the contact destination in `src/pages/About.jsx`. They are currently generic external links, not connected to Jordan's actual profiles.

## Music player

Add a properly licensed track at `public/audio/portfolio-atmosphere.mp3`. The player supports play/pause and volume. It does not autoplay, respecting browser autoplay restrictions.

## Design / implementation notes
- Dark graphite background, lavender-purple accents, glass surfaces and rounded organic corners.
- Desktop layout reserves a fixed left rail; mobile switches to a slide-in navigation.
- Project image click opens a lightbox. The separate **View project** link navigates to the project detail route.
- Lightbox supports Escape and arrow-key navigation.
- The project detail page is data-driven, so new project pages do not require duplicated JSX.
- The UI language is English, as planned for the public portfolio.

## Before publishing
1. Replace all placeholder artwork and sample project copy.
2. Add the real Discord, Reddit, ArtStation, Behance and Patreon profile URLs.
3. Add the licensed MP3 if desired.
4. Run `npm run build` and test the production preview on desktop and mobile.
5. Deploy the generated `dist/` directory to your preferred static host.
